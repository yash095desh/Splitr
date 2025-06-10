import { useMutation, useQuery } from "convex/react"

import { FunctionReference } from "convex/server"; // adjust import path as needed
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query : FunctionReference<"query">, ...args: any) => {
    const result = useQuery(query,...args);

    const [data, setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState <Boolean>(true);
    const [error, setError] = useState <Error | null>(null);

    useEffect(()=>{
        if(result === undefined){
            setIsLoading(true)
        }else{
            try {
                setData(result)
                setError(null)
            } catch (error) {
                setError(error as Error)
                toast.error((error as Error).message)
            }
            finally{
                setIsLoading(false);
            }
        }
    },[result])

    return {
        data,
        isLoading,
        error
    }
}

export const useConvexMutation = (mutation : FunctionReference<"mutation">) => {
    const mutationFn = useMutation(mutation);

    const [data, setData] = useState(undefined);
    const [isLoading, setIsLoading] = useState <Boolean>(true);
    const [error, setError] = useState <Error | null>(null);

    const mutate = async (...args : any) =>{
        setIsLoading(true);
        setError(null);

        try {
            const response = await mutationFn(...args);
            setData(response)
            return response;
        } catch (error) {
            setError(error as Error)
            toast.error((error as Error).message)
            throw error
        }finally{
            setIsLoading(false);
        }
    }

    return { mutate , isLoading, data, error}
}