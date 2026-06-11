import smtplib
from email.message import EmailMessage

import structlog

from core.config import settings

logger = structlog.get_logger(__name__)


class EmailService:
    def __init__(self):
        self.enabled = bool(settings.SMTP_HOST and settings.EMAILS_FROM_EMAIL)

    def _send(self, to_email: str | None, subject: str, html: str) -> None:
        if not to_email:
            return
        if not self.enabled:
            logger.info("email_skipped_smtp_not_configured", to_email=to_email, subject=subject)
            return

        message = EmailMessage()
        message["Subject"] = subject
        message["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        message["To"] = to_email
        message.set_content("Seu cliente de e-mail nao suporta HTML.")
        message.add_alternative(html, subtype="html")

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as smtp:
            smtp.starttls()
            if settings.SMTP_USER:
                smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            smtp.send_message(message)

    def _shell(self, title: str, body: str) -> str:
        logo_url = f"{settings.PUBLIC_FRONTEND_URL}/logo.jpeg"
        return f"""
        <div style="font-family:Arial,sans-serif;background:#f4f5f7;padding:24px">
          <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
            <div style="background:#101014;padding:20px;text-align:center">
              <img src="{logo_url}" alt="{settings.ACADEMY_NAME}" style="max-height:88px;object-fit:contain" />
            </div>
            <div style="padding:28px;color:#1a1a2e">
              <h2 style="margin:0 0 12px;color:#C62828">{title}</h2>
              {body}
              <p style="margin-top:28px">{settings.ACADEMY_SIGNATURE}</p>
            </div>
          </div>
        </div>
        """

    def send_welcome(self, student, plan, enrollment) -> None:
        html = self._shell(
            f"Bem-vindo(a), {student.name}!",
            f"""
            <p>Sua matricula no plano <strong>{plan.name}</strong> foi registrada com sucesso.</p>
            <p>O periodo contratado vai de <strong>{enrollment.start_date:%d/%m/%Y}</strong> ate <strong>{enrollment.end_date:%d/%m/%Y}</strong>.</p>
            <p>Proximo vencimento: <strong>{enrollment.next_payment_due_date:%d/%m/%Y}</strong>.</p>
            <p>Estamos felizes em ter voce treinando conosco. Conte com a equipe para evoluir com disciplina, respeito e consistencia.</p>
            """,
        )
        self._send(student.email, f"Bem-vindo(a) a {settings.ACADEMY_NAME}", html)

    def send_plan_finished(self, student, plan, enrollment) -> None:
        html = self._shell(
            "Seu plano encerrou",
            f"""
            <p>O plano <strong>{plan.name}</strong> de {student.name} teve vigencia ate <strong>{enrollment.end_date:%d/%m/%Y}</strong>.</p>
            <p>Para continuar treinando sem interrupcoes, recomendamos renovar este plano ou escolher uma nova modalidade que combine melhor com sua rotina atual.</p>
            <p>Fale conosco para ajustar horarios, plano e forma de pagamento.</p>
            """,
        )
        self._send(student.email, f"Encerramento do plano {plan.name}", html)

    def send_payment_reminder(self, student, ar) -> None:
        html = self._shell(
            "Lembrete de vencimento",
            f"""
            <p>Estamos passando para lembrar que existe um pagamento em aberto com vencimento em <strong>{ar.due_date:%d/%m/%Y}</strong>.</p>
            <p>Descricao: <strong>{ar.description}</strong></p>
            <p>Valor: <strong>R$ {ar.amount}</strong></p>
            <p>Se voce ja realizou o pagamento, por favor desconsidere este aviso ou envie o comprovante para a equipe.</p>
            """,
        )
        self._send(student.email, "Lembrete de pagamento", html)

    def send_payment_confirmation(self, student, ar, payment) -> None:
        html = self._shell(
            "Pagamento confirmado",
            f"""
            <p>Recebemos o pagamento referente a <strong>{ar.description}</strong>.</p>
            <p>Valor recebido: <strong>R$ {payment.amount_paid}</strong></p>
            <p>Forma de pagamento: <strong>{payment.payment_method}</strong></p>
            <p>Obrigado por manter sua matricula em dia.</p>
            """,
        )
        self._send(student.email, "Pagamento confirmado", html)

    def send_overdue_notice(self, student, ar) -> None:
        html = self._shell(
            "Pagamento em atraso",
            f"""
            <p>Identificamos que o pagamento com vencimento em <strong>{ar.due_date:%d/%m/%Y}</strong> ainda nao foi confirmado.</p>
            <p>Descricao: <strong>{ar.description}</strong></p>
            <p>Valor: <strong>R$ {ar.amount}</strong></p>
            <p>Apos 3 dias de atraso, a matricula podera ser cancelada e o aluno inativado ate a regularizacao.</p>
            <p>Tambem podera haver cobranca de juros conforme regra definida pela academia.</p>
            """,
        )
        self._send(student.email, "Pagamento em atraso", html)
