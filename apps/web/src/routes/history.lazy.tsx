import { createLazyFileRoute } from "@tanstack/react-router";

import { HistoryManager } from "@/components/HistoryManager";

const HistoryPage = () => <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8">
        <HistoryManager
          onNavigate={(url) => {
            // Handle navigation to historical URLs
            window.location.assign(`/#${url}`);
          }}
        />
      </div>
    </div>;

export const Route = createLazyFileRoute("/history")({
  component: HistoryPage,
});

export default HistoryPage;
