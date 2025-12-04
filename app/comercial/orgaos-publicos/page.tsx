'use client'

export default function OrgaosPublicosPage() {
  return (
    <div className="p-4 text-center duration-300 ease-in-out">
      <h1 className="text-4xl md:text-6xl font-bold mb-6 text-[#2f4982] dark:text-blue-400">
        ÓRGÃOS PÚBLICOS
      </h1>
      <div className="h-full grid place-items-center">
        <div className="w-full max-w-[1400px] bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden">
          <iframe
            title="DER TESTE"
            src="https://app.powerbi.com/reportEmbed?reportId=3d021b1a-7c22-4bf5-82ad-135c6b928e97&autoAuth=true&ctid=b3176851-036f-4ba8-b0bf-1517ce3d89e7"
            allowFullScreen
            className="w-full h-[80vh] border-0"
          />
        </div>
      </div>
    </div>
  )
}
