import { useState } from "react";
import AppLayout from "@cloudscape-design/components/app-layout";
import SideNavigation from "@cloudscape-design/components/side-navigation";
import TopNavigation from "@cloudscape-design/components/top-navigation";
import { Overview } from "./pages/Overview";
import { Tools } from "./pages/Tools";

type Page = "overview" | "tools";

const NAV_ITEMS = [
  { type: "link" as const, text: "Overview", href: "#overview" },
  { type: "link" as const, text: "Tools", href: "#tools" },
];

function isPage(value: string): value is Page {
  return value === "overview" || value === "tools";
}

// ADR-003: two pages, Overview and Tools, switched locally — Frank's console
// has no server-side routes of its own to keep in sync with.
export function App() {
  const [page, setPage] = useState<Page>("overview");

  return (
    <>
      <TopNavigation
        identity={{ href: "#overview", title: "Frank" }}
        i18nStrings={{ overflowMenuTriggerText: "More", overflowMenuTitleText: "All" }}
      />
      <AppLayout
        toolsHide
        navigation={
          <SideNavigation
            activeHref={`#${page}`}
            items={NAV_ITEMS}
            onFollow={(event) => {
              event.preventDefault();
              const href = event.detail.href.replace("#", "");
              if (isPage(href)) {
                setPage(href);
              }
            }}
          />
        }
        content={page === "overview" ? <Overview /> : <Tools />}
      />
    </>
  );
}
