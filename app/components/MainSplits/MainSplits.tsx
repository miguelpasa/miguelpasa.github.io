'use client'
import React from "react"
import { AboutMeSection } from "../AboutMeSection/AboutMeSection"
import { MainSplitContainer } from "../MainSplitContainer/MainSplitContainer"

interface MainSplitsProps {

}

export const MainSplits = ({} : MainSplitsProps) => {
    const [currentActiveSlide, setCurrentActiveSlide] = React.useState<string>()

    const clickHandler = (e : React.MouseEvent<Element>) => {
        let classList = (e.target as Element).classList
        
    }

    return (
        <div className="flex flex-row w-full flex-grow gap-4 p-4 pt-0">
            <div className="bg-[#A0C3D2] flex-grow p-4 rounded-2xl duration-200 hover:grow-[1.1]" onClick={(e) => clickHandler(e)}>
                <AboutMeSection show={false}/>
            </div>
            <div className="bg-[#D5E3E8] flex-grow p-4 rounded-2xl duration-200 hover:grow-[1.1]">
                Experience
            </div>
            <div className="bg-[#EAE0DA] flex-grow p-4 rounded-2xl duration-200 hover:grow-[1.1]">
                Services
            </div>
            <div className="bg-[#F7F5EB] flex-grow p-4 rounded-2xl duration-200 hover:grow-[1.1]">
                Contact
            </div>
        </div>
    )
}