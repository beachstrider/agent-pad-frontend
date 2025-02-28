import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import LiveNotifications from '../notifications/LiveNotifications'


interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen ">
       <LiveNotifications />
      <Navbar />
      <main className="w-full flex flex-col flex-grow main-wrapper mt-24">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout