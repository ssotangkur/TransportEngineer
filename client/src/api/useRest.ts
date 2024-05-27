import { ErrorResponse } from "common";
import { useState } from "react";

// export const useRest = (): ApisToProxy<RootApis> => {
//     return {
//         get: async () => {
//             return ""
//         },
//         catalog: {
//             "": {
//                 get: async (_: void) => {
//                     return "Error Not Implemented"
//                 },
//                 post: async (_: EntityType[]) => {
//                     return "Error Not Implemented"
//                 },
//                 delete: async (_: string) => {
//                     return "Error Not Implemented"
//                 }
//             },
//             get: async (_: void) => {
//                 return "Error Not Implemented"
//             },
//             post: async (_: EntityType[]) => {
//                 return "Error Not Implemented"
//             },
//             delete: async (_: string) => {
//                 return "Error Not Implemented"
//             },
//             subcatalog: {
//                 title: {
//                     get: async (_: string) => {
//                         return "Error Not Implemented"
//                     }
//                 }
//             },
//             addComponentTypeToEntityType: { 
//                 post: async (_: EntityTypeComponentType) => {
//                     return "Error Not Implemented"
//                 },
//             },
//             removeComponentTypeFromEntityType: () => {},
//         }
// };

export type UseRestResult<T> = {
    data?: WithoutError<T>,
    error?: string,
    loading: boolean, 
}

export type WithoutError<T> = Exclude<T, ErrorResponse>

export const isErrorResponse = <T>(a: T | ErrorResponse): a is ErrorResponse => {
    // @ts-ignore
    return a?.typeName === 'error'
}

export const useRest = <Resp>(func: () => Promise<Resp>, initialValue?: WithoutError<Resp>): UseRestResult<Resp> => {
    const [result, setResult] = useState<UseRestResult<Resp>>({ loading: true, data: initialValue})

    useState(() => {
        const getData = async () => {
            const dataOrError = await func()
            if (isErrorResponse(dataOrError)) {
                console.error(dataOrError)
                setResult({ loading: false, error: dataOrError.message })
                return
            }
            setResult({ loading: false, data: dataOrError as Exclude<Resp, ErrorResponse>})
        }
        void getData()
    })

    return result
}