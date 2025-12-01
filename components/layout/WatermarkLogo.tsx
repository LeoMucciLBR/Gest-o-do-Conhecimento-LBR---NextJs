import Image from 'next/image'
import type { FC } from 'react'

export const WatermarkLogo: FC<{ logoSrc?: string }> = ({ logoSrc }) => (
  <div className="fixed top-4 right-4 z-50 pointer-events-none">
    {logoSrc ? (
      <Image
        src={logoSrc}
        alt="Logo"
        width={80}
        height={52}
        className="h-13 w-auto"
      />
    ) : (
      <div className="h-10 w-10 bg-gray-500 dark:bg-gray-700 rounded-lg grid place-items-center text-xs text-white font-bold">
        LOGO
      </div>
    )}
  </div>
)

export default WatermarkLogo
