import { PageHeader } from '@/components/layout/Header';
import { Card, CardBody } from '@/components/ui/Card';
import { InsightsList } from '@/components/insights/InsightsList';

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Insights"
        subtitle="Personalized wellness recommendations"
      />

      <Card>
        <CardBody>
          <InsightsList showGenerateButton={true} />
        </CardBody>
      </Card>

      <Card className="bg-gray-50">
        <CardBody>
          <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Log your sleep and diary entries daily</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Our AI analyzes your patterns over time</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Receive personalized recommendations based on your data</span>
            </li>
            <li className="flex items-start gap-2">
              <svg className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>New insights are generated daily at 8 AM</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
