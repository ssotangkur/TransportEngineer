import { Types, defineComponent } from 'bitecs'

/**
 * Entities that have this component will belong to the associated group
 * FYI, an entity can only belong to one group at a time.
 */
export const GroupComponent = defineComponent({
  group: Types.eid,
})

export const DeferredRingTextureCreationComponent = defineComponent({
  refEid: Types.eid,
  color: Types.ui32,
  lineWidth: Types.ui8,
})
