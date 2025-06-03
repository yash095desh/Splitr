import React ,{ ReactNode }from 'react'


function layout({ children } : {children : ReactNode}) {
  return (
    <div className="flex justify-center pt-24" >{children}</div>
  )
}

export default layout