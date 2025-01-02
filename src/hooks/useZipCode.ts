import * as React from 'react'

interface ZipCodeResponse {
   cep: string
   logradouro: string
   complemento: string
   bairro: string
   localidade: string
   uf: string
   ibge: string
   gia: string
   ddd: string
   siafi: string
   erro?: boolean
}

interface ZipCodeCallback {
   address: string
   city: string
   state: string
   neighborhood: string
   zipCode: string
   error?: boolean
}

export const useZipCode = () => {
   const [zipCodeData, setZipCodeData] = React.useState<ZipCodeResponse | null>(
      null
   )
   const [loading, setLoading] = React.useState(false)

   const fetchZipCode = async (zipCode: string) => {
      const cleanZipCode = zipCode.replace(/\D/g, '')
      if (cleanZipCode.length !== 8) {
         return null
      }

      setLoading(true)
      try {
         const response = await fetch(
            `https://viacep.com.br/ws/${cleanZipCode}/json/`
         )
         if (!response.ok) throw new Error(response.statusText)

         const data: ZipCodeResponse = await response.json()
         setZipCodeData(data)
         setLoading(false)
         return data
      } catch (error) {
         console.error('Erro ao buscar CEP:', error)
         setLoading(false)
         return null
      }
   }

   const handleZipCode = async (
      zipCode: string,
      callback: (data: ZipCodeCallback) => void
   ) => {
      const cleanZipCode = zipCode.replace(/\D/g, '')
      if (cleanZipCode.length !== 8) {
         callback({
            address: '',
            city: '',
            state: '',
            neighborhood: '',
            zipCode: '',
            error: true
         })
         return
      }

      setLoading(true)
      try {
         const response = await fetch(
            `https://viacep.com.br/ws/${cleanZipCode}/json/`
         )
         if (!response.ok) throw new Error(response.statusText)

         const data: ZipCodeResponse = await response.json()
         setZipCodeData(data)

         if (data.erro) {
            callback({
               address: '',
               city: '',
               state: '',
               neighborhood: '',
               zipCode: '',
               error: true
            })
         } else {
            callback({
               address: data.logradouro,
               city: data.localidade,
               state: data.uf,
               neighborhood: data.bairro,
               zipCode: data.cep,
               error: false
            })
         }
      } catch (error) {
         console.error('Erro ao buscar CEP:', error)
         callback({
            address: '',
            city: '',
            state: '',
            neighborhood: '',
            zipCode: '',
            error: true
         })
      } finally {
         setLoading(false)
      }
   }

   return { zipCodeData, loading, fetchZipCode, handleZipCode }
}
