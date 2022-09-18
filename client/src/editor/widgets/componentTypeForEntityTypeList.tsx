import React from 'react'
import { useEvent } from 'src/events/useEvent'
import styled from 'styled-components'
import { Scrollable } from './scrollable'

const Container = styled(Scrollable)`
  flex-direction: column;
`

const ListItem = styled.div`
  display: flex;
  flex-direction: row;
  border: 1px solid grey;
`

export const ComponentTypeForEntityTypeList = () => {
  const entity = useEvent('EntityTypeList:EntitySelected')

  if (!entity) {
    return null
  }

  return (
    <Container>
      <div>Components:</div>
      {entity?.[0]?.components?.map((c) => <ListItem>{c.name}</ListItem>) ?? null}
    </Container>
  )
}
