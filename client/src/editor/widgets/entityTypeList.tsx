import React from "react"
import { EntityType } from "src/entities/entityType"
import styled from "styled-components"
import { Scrollable } from "./scrollable"

export type EntityTypeListProps = {
  entityTypes: EntityType[],
}

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

export const EntityTypeList = ({entityTypes}: EntityTypeListProps) => {

  return (
    <Scrollable>
      <ColumnContainer>
        {entityTypes.map((entityType) => <EntityRow key={entityType.name}>{entityType.name}</EntityRow>)}
      </ColumnContainer>
    </Scrollable>
  )
}