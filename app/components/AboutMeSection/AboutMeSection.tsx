interface AboutMeSectionProps {
    show: boolean
}

export const AboutMeSection = ({ show } : AboutMeSectionProps) => {
    if(show) {
        return (
            <div className="flex flex-col">
                about section innit
            </div>
        )
    } else {
        return (
            <div className="flex flex-col items-center">
                About Me
            </div>
        )
    }
}