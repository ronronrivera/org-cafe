// Minimal admin landing. Real control-hub features (org onboarding, categories,
// org_rep credentials, fee_payments import) come later per SRS §3.4 / §3.5.
const Admin = ({ email }) => {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-800">Admin Control Hub</h1>
      <p className="mt-1 text-sm text-slate-500">
        Signed in{email ? ` as ${email}` : ''}.
      </p>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-600">
          Nothing here yet — this is where organization onboarding, categories, and
          org_rep credential management will live.
        </p>
      </div>
    </main>
  )
}

export default Admin
