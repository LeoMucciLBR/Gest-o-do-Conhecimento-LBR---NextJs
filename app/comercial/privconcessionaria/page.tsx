'use client'

export default function PrivConcessionariaPage() {
  return (
    <div className="p-4 text-center duration-300 ease-in-out">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#2f4982] dark:text-blue-400">
        Privados / Concessionárias
      </h1>
      <div className="h-full grid place-items-center">
        <div className="w-full max-w-[1400px] bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <iframe
            title="DER TESTE"
            src="https://app.powerbi.com/reportEmbed?reportId=30d2a831-612a-48b1-90f5-9c2edc1a175f&autoAuth=true&embeddedDemo=true"
            allowFullScreen
            className="w-full h-[80vh] border-0"
          />
        </div>
      </div>
    </div>
  )
}
