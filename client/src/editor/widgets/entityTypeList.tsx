import React from "react"
import { catalog } from "src/entities/catalog"
import { Events } from "src/events/events"
import styled from "styled-components"
import { Scrollable } from "./scrollable"

const ColumnContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`

const EntityRow = styled.div`
  display: flex;
  flex-direction: row;
  border: 1px solid black;
`

export const EntityTypeList = () => {

  const entityTypes = catalog;

  return (
    <Scrollable>
      <ColumnContainer>
        {entityTypes.map((entityType) => 
          <EntityRow 
            key={entityType.name}
            onClick={() => Events.emit('EntityTypeList:EntityClicked', entityType)}
          >
            {entityType.name}
          </EntityRow>
        )}
      </ColumnContainer>
    </Scrollable>
  )
}