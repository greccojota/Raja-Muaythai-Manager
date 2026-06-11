import { useState } from 'react'
import { rawCEP } from '@/utils/validators'

interface AddressFromCep {
  street:       string
  neighborhood: string
  city:         string
  state:        string
}

export function useCep() {
  const [loading, setLoading] = useState(false)

  async function fetchAddress(cep: string): Promise<AddressFromCep | null> {
    const clean = rawCEP(cep)
    if (clean.length !== 8) return null
    setLoading(true)
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (data.erro) return null
      return {
        street:       data.logradouro ?? '',
        neighborhood: data.bairro     ?? '',
        city:         data.localidade ?? '',
        state:        data.uf         ?? '',
      }
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }

  return { fetchAddress, loadingCep: loading }
}
