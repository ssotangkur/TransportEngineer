import React from 'react'
import { ReflexContainer, ReflexElement, ReflexSplitter } from 'react-reflex'
import { EntityTypeList } from './entityTypeList'
import { EntityTypeDetails } from './entityTypeDetails'

export const EntityTypeEditor = () => {
  return (
    <ReflexContainer orientation='horizontal' style={{ height: '100%' }}>
      <ReflexElement flex={1} className='noscroll'>
        <EntityTypeList />
      </ReflexElement>
      <ReflexSplitter />
      <ReflexElement flex={1} className='noscroll'>
        <EntityTypeDetails />
      </ReflexElement>
    </ReflexContainer>
  )
}
