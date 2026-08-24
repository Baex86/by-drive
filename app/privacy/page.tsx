export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 md:p-20 font-sans">
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-14 rounded-2xl shadow-sm border border-gray-100">
        <header className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2A0510] mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500 tracking-wide">Last Updated: August 2026 | Managed by Aksara store</p>
        </header>
        
        <div className="space-y-8 text-gray-600 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">1. Introduction</h2>
            <p>Welcome to BY Drive, a centralized cloud storage aggregation system operated by Aksara store. We respect your privacy and are strictly committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you use our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">2. Google API Services Limited Use Disclosure</h2>
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 text-gray-700">
              <p className="font-semibold mb-2 text-[#2A0510]">Crucial Compliance Statement:</p>
              <p>BY Drive's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google API Services User Data Policy</a>, including the <strong>Limited Use</strong> requirements.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">3. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>OAuth 2.0 Credentials:</strong> We collect authentication tokens to authorize access to your Google Drive accounts.</li>
              <li><strong>Drive Metadata:</strong> We retrieve file names, sizes, mime types, and folder structures strictly to render them on your unified dashboard.</li>
              <li><strong>Zero Payload Storage:</strong> We <strong>do not</strong> download, host, or store your actual file contents (payload) on our local servers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">4. How We Use Your Data</h2>
            <p>Your data is used exclusively to provide the BY Drive aggregation service. We do not use your Google Drive data to serve advertisements, train artificial intelligence models, or conduct unauthorized data mining. The access is strictly utilized to allow you to manage your own multi-node storage environments.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">5. Data Sharing & Third Parties</h2>
            <p>We absolutely do not sell, rent, or trade your personal information or Drive data to third parties. Data is only transmitted securely between your browser, our infrastructure, and the Google Cloud APIs.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">6. Data Security & Revocation</h2>
            <p>All data transmissions are encrypted via industry-standard HTTPS/TLS. You maintain full control over your data. You can revoke BY Drive's access to your Google account at any time either through the BY Drive settings panel or directly via your Google Account Security settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-3">7. Contact Information</h2>
            <p>If you have any questions or concerns regarding this Privacy Policy or our data practices, please contact our administrative team at your designated support email.</p>
          </section>
        </div>
      </div>
    </div>
  );
}