import React, { createContext, useContext, useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/firebase"
import { useAuth } from "./AuthContext"


type Institute = {
    instituteName?: string
    email?: string
} | null

type InstituteContextType = {
    institute: Institute
    loading: boolean
}

const InstituteContext = createContext<InstituteContextType>({
    institute: null,
    loading: true,
})

export const InstituteProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth()
    const [institute, setInstitute] = useState<Institute>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchInstitute = async () => {
            if (user?.uid) {
                const docRef = doc(db, "institutes", user.uid)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    setInstitute(docSnap.data() as Institute)
                }
            }
            setLoading(false)
        }

        fetchInstitute()
    }, [user])

    return (
        <InstituteContext.Provider value={{ institute, loading }}>
            {children}
        </InstituteContext.Provider>
    )
}

export const useInstitute = () => {
    return useContext(InstituteContext)
}