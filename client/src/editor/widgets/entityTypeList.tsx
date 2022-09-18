import React, { useState } from 'react'
import { EntityType } from 'common/src/entities/entityType'
import { useCatalog } from 'src/entities/useCatalog'
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
  const entityTypes = useCatalog()
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>()

  if (!entityTypes) return <div>Loading...</div>

  const onClick = (entityType: EntityType) => {
    setSelectedEntityType(entityType)
    Events.emit('EntityTypeList:EntitySelected', entityType)
  }

  return (
    <Scrollable>
      <ColumnContainer>
        {entityTypes.map((entityType) => (
          <EntityRow
            key={entityType.name}
            onClick={() => onClick(entityType)}
            selected={selectedEntityType === entityType}
          >
            {entityType.name}
          </EntityRow>
        ))}
      </ColumnContainer>
    </Scrollable>
  )
}
