import React from 'react'
import { Scrollable } from './scrollable'
import { ComponentTypeChooser } from './componentTypeChooser'
import { ComponentTypeForEntityTypeList } from './componentTypeForEntityTypeList'
import { Column } from './layout/column'

export const EntityTypeDetails = () => {
  return (
    <Scrollable>
      <Column>
        <ComponentTypeForEntityTypeList />
        <ComponentTypeChooser />
      </Column>
    </Scrollable>
  )
}
