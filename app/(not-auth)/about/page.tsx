export default function About() {
  return (
    <div className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          About 1v1 Core
        </h1>

        <div className="prose prose-lg">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">What is 1v1 Core?</h2>
            <p className="text-gray-600 mb-4">
              1v1 Core is a comprehensive tournament management platform
              designed specifically for competitive 1v1 matches. We provide
              tournament organizers with powerful tools to create, manage, and
              broadcast exciting esports competitions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Features</h2>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Automated bracket generation with random matchmaking</li>
              <li>Secure player authentication with private access codes</li>
              <li>Real-time champion selection visible to broadcasters</li>
              <li>Live match status updates</li>
              <li>Multi-game support</li>
              <li>Tournament history and statistics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How It Works</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  For Players
                </h3>
                <p>
                  Players receive unique access codes to join tournaments. When
                  a match is activated, both players connect to the platform and
                  select their champion within a time limit. The selection
                  process is visible to administrators and broadcasters in
                  real-time.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  For Administrators
                </h3>
                <p>
                  Tournament administrators can create tournaments, generate
                  brackets, activate matches, and monitor player selections in
                  real-time. This enables seamless broadcasting and tournament
                  management.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact</h2>
            <p className="text-gray-600">
              For questions or support, please contact our team at
              support@1v1core.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
