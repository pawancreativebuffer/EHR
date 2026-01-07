import {
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Languages,
  BadgeCheck,
  OptionIcon
} from "lucide-react"

type PatientProps = {
  patient: any
}

export default function PatientProfile({ patient }: PatientProps) {
  const name = patient.name?.find((n: any) => n.use === "official")
  const email = patient.telecom?.find((t: any) => t.system === "email")
  const phones = patient.telecom?.filter((t: any) => t.system === "phone")
  const address = patient.address?.[0]

  return (
    <div className="mx-auto py-6 space-y-6">
      
      {/* Header Card */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center">
            <User className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold">
              {name?.text}
            </h1>
            <p className="text-sm opacity-80">
              Patient ID · {patient.id}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <Badge label={patient.gender} />
          <Badge label={`DOB: ${patient.birthDate}`} />
          <Badge label={patient.maritalStatus?.text} />
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Contact Info */}
        <Card title="Contact Information" icon={<Phone />}>
          {phones?.map((p: any, i: number) => (
            <InfoRow key={i} icon={<Phone />} text={p.value} />
          ))}
          {email && (
            <InfoRow icon={<Mail />} text={email.value} />
          )}
        </Card>

        {/* Address */}
        <Card title="Address" icon={<MapPin />}>
          <p className="text-gray-700 text-sm leading-relaxed">
            {address?.text}
          </p>
        </Card>

        {/* Languages */}
        <Card title="Languages" icon={<Languages />}>
          <ul className="space-y-2">
            {patient.communication?.map((c: any, i: number) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm text-gray-700"
              >
                <span>{c.language?.text}</span>
                {c.preferred && (
                  <span className="text-xs text-green-600 font-medium">
                    Preferred
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        {/* Care Provider */}
        <Card title="Care Provider" icon={<OptionIcon />}>
          <InfoRow
            icon={<BadgeCheck />}
            text={patient.generalPractitioner?.[0]?.display}
          />
          <InfoRow
            icon={<OptionIcon />}
            text={patient.managingOrganization?.display}
          />
        </Card>
      </div>

      {/* Identifiers */}
      <Card title="Identifiers" icon={<BadgeCheck />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {patient.identifier?.map((id: any, i: number) => (
            <div
              key={i}
              className="bg-gray-50 rounded-lg px-3 py-2"
            >
              <p className="text-xs text-gray-500">
                {id.type?.text}
              </p>
              <p className="text-gray-800 font-medium truncate">
                {id.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ---------- Small UI Helpers ---------- */

function Card({ title, icon, children }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-blue-600">{icon}</div>
        <h2 className="text-lg font-semibold text-gray-800">
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ icon, text }: any) {
  if (!text) return null
  return (
    <div className="flex items-center gap-2 text-sm text-gray-700 mb-2">
      <span className="text-gray-400">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

function Badge({ label }: any) {
  if (!label) return null
  return (
    <span className="px-3 py-1 rounded-full bg-white/20 text-xs capitalize">
      {label}
    </span>
  )
}
