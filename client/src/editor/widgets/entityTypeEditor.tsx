import React from 'react'
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex'
import { ComponentTypeChooser } from './componentTypeChooser'
import { ComponentTypeForEntityTypeList } from './componentTypeForEntityTypeList'
import { EntityTypeList } from './entityTypeList'

export const EntityTypeEditor = () => {
  return (
    <ReflexContainer orientation='horizontal' style={{ height: '100%' }}>
      <ReflexElement flex={1} className='noscroll'>
        <EntityTypeList />
      </ReflexElement>
      <ReflexSplitter />
      <ReflexElement flex={1} className='noscroll'>
        <ComponentTypeForEntityTypeList />
        <ComponentTypeChooser />
      </ReflexElement>
    </ReflexContainer>
  )
}
