import React, { useEffect, useState } from 'react'
import { Layout, PageBlock, PageHeader, Spinner, Alert } from 'vtex.styleguide'
import { useQuery } from 'react-apollo'
import type { Tenant } from 'vtex.tenant-graphql'

import { AlertProvider } from '../../providers/AlertProvider'
import { BindingInfo } from './BindingInfo'
import TENANT_INFO from '../../graphql/tenantInfo.gql'
import SALES_CHANNELS from '../../graphql/salesChannel.gql'

const AdminPanel = () => {
  const [settings, setSettings] = useState<Settings[]>([])
  const [salesChannelList, setSalesChannelList] = useState<SalesChannel[]>([])

  const {
    data: tenantData,
    loading: loadingTenant,
    error: errorTenant,
  } = useQuery<{ tenantInfo: Tenant }>(TENANT_INFO)

  const {
    data: salesChannelsData,
    loading: loadingSalesChannelsData,
    error: errorSalesChannelsData,
  } = useQuery<{ salesChannel: SalesChannel[] }>(SALES_CHANNELS)

  const isLoading = loadingTenant || loadingSalesChannelsData
  const isError = !errorTenant || errorSalesChannelsData

  useEffect(() => {
    if (tenantData) {
      const config = tenantData.tenantInfo.bindings
        .filter(binding => binding.targetProduct === 'vtex-storefront')
        .map(({ id, canonicalBaseAddress, extraContext }) => {
          return {
            bindingId: id,
            canonicalBaseAddress,
            salesChannelInfo: [
              {
                salesChannel: extraContext?.portal?.salesChannel,
              },
            ],
          }
        })

      setSettings(config)
    }
  }, [tenantData])

  useEffect(() => {
    if (salesChannelsData) {
      const currentSalesChannelsData = salesChannelsData.salesChannel.map(
        ({ id, name, currencyCode, currencySymbol, isActive }) => {
          return {
            id,
            name,
            currencyCode,
            currencySymbol,
            isActive,
          }
        }
      )

      setSalesChannelList(currentSalesChannelsData)
    }
  }, [salesChannelsData])

  return (
    <AlertProvider>
      <Layout pageHeader={<PageHeader title="Currency Selector"></PageHeader>}>
        <PageBlock>
          {isError ? (
            <Alert type="error">Something went wrong, Please try again.</Alert>
          ) : isLoading ? (
            <Spinner />
          ) : settings ? (
            settings.map(
              ({ bindingId, canonicalBaseAddress, salesChannelInfo }) => {
                return (
                  <BindingInfo
                    bindingId={bindingId}
                    canonicalBaseAddress={canonicalBaseAddress}
                    salesChannelInfo={salesChannelInfo}
                    salesChannelList={salesChannelList}
                  />
                )
              }
            )
          ) : null}
        </PageBlock>
      </Layout>
    </AlertProvider>
  )
}

export { AdminPanel }
