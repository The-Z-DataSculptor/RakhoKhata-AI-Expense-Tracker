import { Metadata } from "next";
import FeatureHero from "../../../../components/marketing/features/budget-planner/FeatureHero";
import FeaturePreview from "../../../../components/marketing/features/budget-planner/FeaturePreview";
import FeatureBenefits from "../../../../components/marketing/features/budget-planner/FeatureBenefits";
import FeatureWorkflow from "../../../../components/marketing/features/budget-planner/FeatureWorkflow";
import FeatureGrid from "../../../../components/marketing/features/budget-planner/FeatureGrid";
import FeatureFaq from "../../../../components/marketing/features/budget-planner/FeatureFaq";
import FeatureCta from "../../../../components/marketing/features/budget-planner/FeatureCta";

export const metadata: Metadata = {
  title: "Visual Category Budget Planner & Expense Limits | RakhoKhaata",
  description:
    "Set category spending limits, track expenses with visual donut progress rings, and pace your budget weekly or monthly to avoid overspending.",
  keywords: [
    "category budget planner",
    "visual expense tracker",
    "spending limit tracker",
    "monthly budget pace tracker",
    "donut chart budget app",
    "prevent overspending tool",
  ],
  openGraph: {
    title: "Visual Category Budget Planner | RakhoKhaata",
    description:
      "Set category limits, monitor spending with live color-coded donut rings, and know exactly how much safe cash remains.",
    type: "website",
  },
};

const SIMPLE_BENEFITS = [
  {
    problem:
      "You check your bank balance at the end of the month and wonder where all your money went because you had no spending guardrails in place.",
    solution:
      "Set simple target limits for groceries, eating out, or fuel. Visual donut rings show you exactly how much money is left before you overspend.",
  },
  {
    problem:
      "Looking at raw tables of numbers makes it confusing to know if you are spending money too fast early in the month.",
    solution:
      "Pace your money with 1-click time switcher filters (This Week, Half Month, This Month). Our engine scales your limits so you always pace your spending correctly.",
  },
  {
    problem:
      "Most budget apps send delayed warnings after you have already blown your budget and run out of money.",
    solution:
      "Clear color-coded badges (Green = On Track, Amber = Warning at 80%, Red = Over Limit) give you clear visual cues long before you run out of cash.",
  },
];

const SIMPLE_WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Pick a Category & Set a Limit",
    description:
      "Choose a spending category like Groceries or Entertainment, pick your dates, and enter the maximum amount you want to spend.",
  },
  {
    step: "02",
    title: "Log Daily Expenses as You Spend",
    description:
      "Whenever you record an expense, RakhoKhaata automatically matches it to your active budget and updates the donut ring instantly.",
  },
  {
    step: "03",
    title: "Stay on Pace & Protect Savings",
    description:
      "Watch your progress rings change from Green to Amber, check your remaining cash balance, and stay within your safe limits every month.",
  },
];

const SIMPLE_GRID_ITEMS = [
  {
    title: "Visual Donut Progress Rings",
    description:
      "See percentage used and cash remaining at a single glance without deciphering complex accounting charts.",
    iconName: "donut",
  },
  {
    title: "Time-Paced Scaling (7d, 14d, 30d)",
    description:
      "Switch between weekly, bi-weekly, and monthly views. Your targets scale proportionally so you don't overspend early.",
    iconName: "clock",
  },
  {
    title: "Smart Color Alerts",
    description:
      "Instant visual feedback: Green when safe, Amber when you reach 80%, and Red when you cross the maximum ceiling.",
    iconName: "alert",
  },
  {
    title: "Multi-Currency Ready",
    description:
      "Budgets automatically recalculate using live exchange rates if you switch your workspace currency.",
    iconName: "globe",
  },
  {
    title: "Flexible Date Windows",
    description:
      "Set budgets that match your exact pay cycle—whether you get paid weekly, bi-weekly, or on the 1st of every month.",
    iconName: "calendar",
  },
  {
    title: "Safe-to-Spend Balance",
    description:
      "Always know your exact unspent allowance with clear '+Available' cash metrics on every category card.",
    iconName: "shield",
  },
];

const SIMPLE_FAQ_ITEMS = [
  {
    question: "How do the visual budget rings work?",
    answer:
      "Each category card has a circular donut progress ring. As you log expenses, the ring fills up and displays your percentage spent. It stays green when safe, turns amber at 80% to give you an early warning, and turns red if you exceed 100%.",
  },
  {
    question: "What does the 'This Week' and 'Half Month' time switcher do?",
    answer:
      "If you set a monthly budget of $600 for dining, switching to 'This Week' automatically scales that limit to around $140. This helps you track whether you are spending too fast in the first week of the month.",
  },
  {
    question: "Can I set different budgets for my business and personal books?",
    answer:
      "Yes. Workspaces are completely separated. You can set software subscription and travel budgets in your business workspace, and grocery or utility limits in your personal household workspace.",
  },
  {
    question: "What happens if I change my currency?",
    answer:
      "All your budget limits and spent amounts convert automatically into your new currency using live exchange rates, keeping your historical numbers accurate.",
  },
  {
    question: "Can I edit or delete a budget at any time?",
    answer:
      "Yes. You can edit the target amount, adjust the start and end dates, or delete any budget rule with a single click.",
  },
];

export default function BudgetPlannerPage() {
  return (
    <main>
      <FeatureHero
        badge="Visual Category Budgeting"
        title="Set Clear Spending Limits and Stop Wondering Where Your Money Went"
        description="Take control of your monthly cash flow with visual donut progress rings, intelligent 80% warning alerts, and time-scaled budget pacing."
        primaryCtaText="Start Budgeting Free"
        primaryCtaLink="/signup"
        secondaryCtaText="See Interactive Demo"
        secondaryCtaLink="#preview"
      />

      <FeaturePreview
        id="preview"
        headline="Interactive Budget Donut Simulator"
        subheadline="Click the time switcher buttons below to see how RakhoKhaata dynamically scales and color-codes your category limits."
      />

      <FeatureBenefits
        sectionTitle="Why Traditional Budgeting Fails (And How We Fix It)"
        sectionSubtitle="Most people give up on budgeting because spreadsheets are tedious and rigid. RakhoKhaata makes pacing effortless."
        benefits={SIMPLE_BENEFITS}
      />

      <FeatureWorkflow
        sectionTitle="How Visual Budgeting Works in 3 Simple Steps"
        sectionSubtitle="Set your limits once, log expenses naturally, and let visual rings keep you on track."
        steps={SIMPLE_WORKFLOW_STEPS}
      />

      <FeatureGrid
        sectionTitle="Everything You Need to Master Monthly Spending"
        sectionSubtitle="Built with clear color alerts, time scaling, and multi-currency support."
        items={SIMPLE_GRID_ITEMS}
      />

      <FeatureFaq
        sectionTitle="Frequently Asked Questions"
        sectionSubtitle="Everything you need to know about category limits, warnings, and time pacing."
        items={SIMPLE_FAQ_ITEMS}
      />

      <FeatureCta
        title="Ready to Build Better Spending Habits?"
        description="Set your first category budget in under 2 minutes. Free forever, no credit card required."
        buttonText="Create Your First Budget Free"
        buttonLink="/signup"
      />
    </main>
  );
}