import React from 'react'
import { allComponentTypes, ComponentType } from 'common/src/entities/componentType'
import { EntityType } from 'common/src/entities/entityType'
import { Events } from 'src/events/events'
import { useEvent } from 'src/events/useEvent'
import styled from 'styled-components'
import { Scrollable } from './scrollable'

const Container = styled(Scrollable)`
  flex-direction: column;
`

const Row = styled.div`
  display: flex;
  flex-direction: row;
`

const AddButton = styled.button`
  background-color: blue;
  color: white;
`

const RemoveButton = styled.button`
  background-color: red;
  color: white;
`

const equals = (a: ComponentType, b: ComponentType) => a.name == b.name
const containsComponentType = (entityType: EntityType, componentType: ComponentType) => {
  return entityType.components.map((c) => c.name).includes(componentType.name)
}

/**
 * Show Add button if component does not exist in entity, show Remove if it does
 * Invokes Add/Remove event respectively
 * @param componentType
 * @param entityType
 */
const AddRemoveButton = ({
  componentType,
  entityType,
}: {
  componentType: ComponentType
  entityType: EntityType
}) => {
  if (containsComponentType(entityType, componentType)) {
    return (
      <RemoveButton
        onClick={() => Events.emit('removeComponentTypeToEntityType', componentType, entityType)}
      >
        Remove
      </RemoveButton>
    )
  }
  return (
    <AddButton
      onClick={() => Events.emit('addComponentTypeToEntityType', componentType, entityType)}
    >
      Add
    </AddButton>
  )
}

export const ComponentTypeChooser = () => {
  const payload = useEvent('EntityTypeList:EntitySelected')

  if (!payload) return null

  const [entityType] = payload

  return (
    <Container>
      {allComponentTypes.map((ct) => (
        <Row>
          <div>{ct.name}</div>
          <AddRemoveButton componentType={ct} entityType={entityType} />
        </Row>
      ))}
    </Container>
  )
}
