export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 md:p-20 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-14 rounded-2xl shadow-sm border border-gray-100">
        <header className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2A0510] mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-500 tracking-wide">Last Updated: August 2026 | Managed by Aksara store</p>
        </header>
        
        <div className="space-y-8 text-gray-600 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using the BY Drive system, provided by Aksara store, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you are prohibited from accessing the system.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">2. Description of Service</h2>
            <p>BY Drive is a proprietary cloud storage aggregator that interfaces with Google Drive via official APIs. We provide a unified dashboard for viewing, organizing, and managing files across multiple authenticated accounts. We act solely as an intermediary interface and do not claim ownership of any files managed through our platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">3. Acceptable Use Policy</h2>
            <p>You agree to use BY Drive strictly in compliance with all applicable local, state, national, and international laws. You explicitly agree not to use the system to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Manage, distribute, or store any illegal, infringing, or malicious content.</li>
              <li>Violate the Google Drive Terms of Service or Google Acceptable Use Policies.</li>
              <li>Attempt to reverse-engineer, disrupt, or compromise the integrity of the BY Drive infrastructure.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">4. Limitation of Liability</h2>
            <p>The service is provided on an "AS IS" and "AS AVAILABLE" basis. Aksara store and the developers of BY Drive shall not be held liable for any indirect, incidental, special, or consequential damages, including but not limited to loss of data, loss of profits, or business interruption arising out of the use or inability to use the service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">5. Service Modifications & Termination</h2>
            <p>We reserve the right to modify, suspend, or discontinue the service (or any part thereof) at any time, with or without notice. We may terminate your access to the system immediately if you breach these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">6. Governing Law</h2>
            <p>These Terms shall be governed and construed in accordance with the standard operating laws applicable to digital services, without regard to its conflict of law provisions.</p>
          </section>
        </div>
      </div>
    </div>
  );
}