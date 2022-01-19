import React, { useState } from 'react'
import { defineMessages } from 'react-intl'
import { useMutation } from 'react-apollo'
import { useRuntime } from 'vtex.render-runtime'
import { useOrderForm } from 'vtex.order-manager/OrderForm'

import { useCurrencySelector } from './hooks/useCurrencySelector'
import CurrencySelectorDropdown from '../views/CurrencySelectorDropdown'
import { patchSalesChannelToSession } from './utils/patchSalesChannelToSession'
import UPDATE_CART_SALES_CHANNEL from './graphql/updateCartSalesChannel.gql'

const messages = defineMessages({
  title: { id: 'admin/currency-selector.title' },
  default: {
    id: 'store/currency-selector.label-format.default',
  },
  description: {
    id: 'store/currency-selector.label-format.description',
  },
})

interface Props {
  labelFormat: string
}

const CurrencySelectorBlock = ({
  labelFormat = messages.default.id,
}: Props) => {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const {
    currentSalesChannel,
    salesChannelList,
    isLoading: isLoadingHook,
    hasError,
    orderFormId,
  } = useCurrencySelector()

  const { rootPath } = useRuntime()

  const {
    orderForm: { items },
  } = useOrderForm()

  const [updateCartSalesChannel] = useMutation<
    unknown,
    {
      salesChannel: string
      orderFormId: string
    }
  >(UPDATE_CART_SALES_CHANNEL)

  const handleSalesChannelSelection = async (
    salesChannel: string,
    cultureInfo: string,
    callBack?: () => void
  ) => {
    setIsRedirecting(true)
    /**
     * Tried to use useUpdateSession from vtex.session-client.
     * Hoewever, for some reason, when the pages reloads, the prices are not updated
     * to reflect the new sales channel in session.
     */
    await patchSalesChannelToSession(salesChannel, cultureInfo, rootPath)

    if (items.length) {
      await updateCartSalesChannel({
        variables: {
          orderFormId,
          salesChannel,
        },
      })
    }

    if (callBack) {
      callBack()
    }

    window.location.reload()
  }

  const isLoading = isRedirecting || isLoadingHook

  if (!isLoading && salesChannelList.length < 2) {
    console.warn(
      'There should be at least two sales channels for the current binding to show the CurrencySelectorBlock'
    )

    return null
  }

  return hasError ? null : (
    <CurrencySelectorDropdown
      currentSalesChannel={currentSalesChannel}
      labelFormat={labelFormat}
      salesChannelList={salesChannelList}
      onSalesChannelSelection={handleSalesChannelSelection}
      isLoading={isLoading}
    />
  )
}

CurrencySelectorBlock.schema = {
  title: messages.title.id,
}

export default CurrencySelectorBlock
