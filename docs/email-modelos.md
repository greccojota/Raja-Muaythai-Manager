# Modelos de e-mail do sistema

Destinatario de teste: `jvgrecco@hotmail.com`

Status de envio real: **nao enviado**, porque o `.env` ainda nao possui SMTP configurado:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=noreply@raja.com.br
```

Para enviar e-mail real, o sistema precisa de um remetente autorizado por um servidor SMTP. Pode ser um e-mail teste temporario, por exemplo `teste@seudominio.com`, desde que exista SMTP/usuario/senha para ele. Nao e seguro usar um remetente inventado sem autenticar no provedor, porque o envio falha ou cai em spam.

---

## 1. Boas-vindas

Assunto:

```text
Bem-vindo(a) a Arena Thai Raja Stadium
```

Corpo:

```html
<h2>Bem-vindo(a), Joao Victor Bezerra Grecco!</h2>
<p>Sua matricula no plano <strong>Semestral</strong> foi registrada com sucesso.</p>
<p>O periodo contratado vai de <strong>09/06/2026</strong> ate <strong>09/12/2026</strong>.</p>
<p>Proximo vencimento: <strong>09/12/2026</strong>.</p>
<p>Estamos felizes em ter voce treinando conosco. Conte com a equipe para evoluir com disciplina, respeito e consistencia.</p>
<p>Equipe Arena Thai Raja Stadium</p>
```

---

## 2. Encerramento de plano

Assunto:

```text
Encerramento do plano Semestral
```

Corpo:

```html
<h2>Seu plano encerrou</h2>
<p>O plano <strong>Semestral</strong> de Joao Victor Bezerra Grecco teve vigencia ate <strong>09/12/2026</strong>.</p>
<p>Para continuar treinando sem interrupcoes, recomendamos renovar este plano ou escolher uma nova modalidade que combine melhor com sua rotina atual.</p>
<p>Fale conosco para ajustar horarios, plano e forma de pagamento.</p>
<p>Equipe Arena Thai Raja Stadium</p>
```

---

## 3. Lembrete de pagamento

Assunto:

```text
Lembrete de pagamento
```

Corpo:

```html
<h2>Lembrete de vencimento</h2>
<p>Estamos passando para lembrar que existe um pagamento em aberto com vencimento em <strong>09/12/2026</strong>.</p>
<p>Descricao: <strong>Proximo vencimento - Semestral (2026-12)</strong></p>
<p>Valor: <strong>R$ 120.00</strong></p>
<p>Se voce ja realizou o pagamento, por favor desconsidere este aviso ou envie o comprovante para a equipe.</p>
<p>Equipe Arena Thai Raja Stadium</p>
```

---

## 4. Confirmacao de pagamento

Assunto:

```text
Pagamento confirmado
```

Corpo:

```html
<h2>Pagamento confirmado</h2>
<p>Recebemos o pagamento referente a <strong>Plano Semestral (2026-06)</strong>.</p>
<p>Valor recebido: <strong>R$ 120.00</strong></p>
<p>Forma de pagamento: <strong>pix</strong></p>
<p>Obrigado por manter sua matricula em dia.</p>
<p>Equipe Arena Thai Raja Stadium</p>
```

---

## 5. Pagamento em atraso

Assunto:

```text
Pagamento em atraso
```

Corpo:

```html
<h2>Pagamento em atraso</h2>
<p>Identificamos que o pagamento com vencimento em <strong>09/12/2026</strong> ainda nao foi confirmado.</p>
<p>Descricao: <strong>Proximo vencimento - Semestral (2026-12)</strong></p>
<p>Valor: <strong>R$ 120.00</strong></p>
<p>Apos 3 dias de atraso, a matricula podera ser cancelada e o aluno inativado ate a regularizacao.</p>
<p>Tambem podera haver cobranca de juros conforme regra definida pela academia.</p>
<p>Equipe Arena Thai Raja Stadium</p>
```
