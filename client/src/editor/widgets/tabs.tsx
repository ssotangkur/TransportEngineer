import React, { PropsWithChildren, ReactElement, useState } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: 100%;
`

const TabRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-grow: 0;
  padding-top: 0.25rem;
  padding-left: 0.5rem;
  &::after,
  &::before {
    border-bottom: 1px solid grey;
    content: '';
    width: 100%;
    position: absolute;
    bottom: 0;
    left: 0;
  }
`

const TabElement = styled.div<{ active?: boolean }>`
  display: flex;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  padding-top: 0.25rem;
  padding-right: 0.25rem;
  border: 1px solid grey;
  // color the bottom border to match the background, covering over the tab row border
  border-bottom-color: ${(props) => (props.active ? 'white' : 'solid grey')};
  background-color: ${(props) => (props.active ? 'white' : 'lightgrey')};
  margin-right: 0.5rem;
  z-index: 1;
`

export type TabProps = PropsWithChildren<{ label: string }>

export const Tab = ({ children }: TabProps) => {
  return <TabContent>{children}</TabContent>
}

const TabContent = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  padding-top: 0.5rem;
`

export type TabsProps = {
  children:
    | ReactElement<PropsWithChildren<TabProps>>
    | ReactElement<PropsWithChildren<TabProps>>[]
    | null
}

type TabChild = ReactElement<PropsWithChildren<TabProps>>
const isTabChild = (x: any): x is TabChild => !!x?.props?.label

export const Tabs = ({ children }: TabsProps) => {
  const tabChildren: TabChild[] = React.Children.toArray(children).filter(isTabChild)
  const [activeChild, setActiveChild] = useState(tabChildren.length ? tabChildren[0] : null)

  return (
    <Container>
      <TabRow>
        {tabChildren.map((child) => {
          return (
            <TabElement
              key={child.props.label}
              active={child.props.label === activeChild?.props.label}
              onClick={() => setActiveChild(child)}
            >
              {child.props.label}
            </TabElement>
          )
        })}
      </TabRow>
      {activeChild}
    </Container>
  )
}
