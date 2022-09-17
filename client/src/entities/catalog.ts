
import catalogFile from 'data/catalog.json'
import { EntityType } from './entityType'


export const catalog: EntityType[] = catalogFile;



export class Catalog {

  constructor(private catalogFile: string) {

  }

  load() {
    
  }
}