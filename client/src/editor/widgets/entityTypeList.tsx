import React, { useEffect, useState } from 'react'
import { EntityType } from 'common/src/entities/entityType'
// import { useCatalog } from 'src/entities/useCatalog'
import { useCatalog } from 'src/api/useWebSocket'
import { Events } from 'src/events/events'
import styled from 'styled-components'
import { Scrollable } from './scrollable'

const ColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const EntityRow = styled.div<{ selected?: boolean }>`
  display: flex;
  flex-direction: row;
  border: 1px solid black;
  ${(props) => props.selected && 'background-color: blue'};
  ${(props) => props.selected && 'color: white'};
`

export const EntityTypeList = () => {
  const catalog = useCatalog()
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>()

  const select = (entityType: EntityType) => {
    setSelectedEntityType(entityType)
    Events.emit('EntityTypeList:EntitySelected', entityType)
  }

  // Auto select first one when loaded
  useEffect(() => {
    if (
      catalog?.length &&
      (!selectedEntityType || (selectedEntityType && !catalog.includes(selectedEntityType)))
    ) {
      select(catalog[0])
    }
  }, [catalog])

  if (!catalog || !selectedEntityType) return <div>Loading...</div>

  return (
    <Scrollable>
      <ColumnContainer>
        {catalog.map((entityType) => (
          <EntityRow
            key={entityType.name}
            onClick={() => select(entityType)}
            selected={selectedEntityType.name === entityType.name}
          >
            {entityType.name}
          </EntityRow>
        ))}
      </ColumnContainer>
    </Scrollable>
  )
}
