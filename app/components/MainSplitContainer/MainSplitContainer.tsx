interface MainSplitContainerProps {
    children: JSX.Element[],
    bgColor: string
}

export const MainSplitContainer = ({ children, bgColor } : MainSplitContainerProps) => {
    console.log(bgColor)
    return (
        <div className={"flex-grow bg-[#" + {bgColor} + "]"}>
            {children}
        </div>
    )
}