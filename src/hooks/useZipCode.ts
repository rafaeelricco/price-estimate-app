/**
 *  @title Zip Code Hook
 *  @notice A custom React hook for fetching Brazilian postal code (CEP) information
 *  @dev Uses the ViaCEP API to fetch address details
 */

import * as React from 'react'

/** @dev Interface for API response */
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

/** @dev Interface for callback data */
interface ZipCodeCallback {
   address: string
   city: string
   state: string
   neighborhood: string
   zipCode: string
   error?: boolean
}

/**
 *  @notice Creates a zip code fetcher with state management
 *  @return Object containing zip code data, loading state, and fetch functions
 */
export const useZipCode = () => {
   /** @dev Initialize states */
   const [zipCodeData, setZipCodeData] = React.useState<ZipCodeResponse | null>(
      null
   )
   const [loading, setLoading] = React.useState(false)

   /** @dev Direct fetch function returning raw API data */
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

   /** @dev Handler function with callback for processed data */
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
