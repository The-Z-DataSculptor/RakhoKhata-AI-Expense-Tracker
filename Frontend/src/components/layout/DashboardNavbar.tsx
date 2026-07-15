// src/components/layout/DashboardNavbar.tsx
"use client";

/* ==========================================================================
   === SECTION 1: IMPORTS ===
   ========================================================================== */
import React, { useState, useSyncExternalStore, useEffect, useRef } from "react";
import {
  FiSun,
  FiMoon,
  FiMonitor,
  FiBell,
  FiCheck,
  FiMenu,
  FiX,
  FiSunrise,
  FiSunset,
  FiStar,
  FiCalendar,
  FiAlertCircle,
  FiInfo,
  FiCheckCircle
} from "react-icons/fi";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { notificationService, Notification } from "@/utils/api"; 
import styles from "./DashboardNavbar.module.css";
/* === SECTION 1 END === */

/* ==========================================================================
   === SECTION 2: TYPES & INTERFACES ===
   ========================================================================== */
type CurrencyType = "PKR" | "USD" | "EUR" | "GBP" | "INR" | "AED" | "SAR" | "KWD" | "OMR" | "QAR" | "BHD";

interface CurrencyOption {
  code: CurrencyType;
  symbol: string;
  label: string;
  flag: string;
}

interface DashboardNavbarProps {
  user?: {
    id: string;
    name: string;
    email: string;
    uiTheme?: string;
  } | null;
}
/* === SECTION 2 END === */

/* ==========================================================================
   === SECTION 3: UTILITY FUNCTIONS ===
   ========================================================================== */
function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getNotificationIcon(sourceType: string) {
  switch (sourceType) {
    case "BILL_REMINDER": return <FiCalendar size={18} className={styles.iconBill} />;
    case "BUDGET_ALERT": return <FiAlertCircle size={18} className={styles.iconAlert} />;
    default: return <FiInfo size={18} className={styles.iconSystem} />;
  }
}
/* === SECTION 3 END === */

/* ==========================================================================
   === SECTION 4: COMPONENT LOGIC ===
   ========================================================================== */
const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee", flag: "🇵🇰" },
  { code: "USD", symbol: "$", label: "US Dollar", flag: "🇺🇸" },
  { code: "EUR", symbol: "€", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", symbol: "£", label: "British Pound", flag: "🇬🇧" },
  { code: "INR", symbol: "₹", label: "Indian Rupee", flag: "🇮🇳" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham", flag: "🇦🇪" },
  { code: "SAR", symbol: "ر.س", label: "Saudi Riyal", flag: "🇸🇦" },
  { code: "KWD", symbol: "د.ك", label: "Kuwaiti Dinar", flag: "🇰🇼" },
  { code: "OMR", symbol: "ر.ع.", label: "Omani Rial", flag: "🇴🇲" },
  { code: "QAR", symbol: "ر.ق", label: "Qatari Riyal", flag: "🇶🇦" },
  { code: "BHD", symbol: "د.ب", label: "Bahraini Dinar", flag: "🇧🇭" },
];

const emptySubscribe = () => () => {};

const timeGreetings = [
  { hourStart: 5, hourEnd: 11, icon: <FiSunrise size={18} />, text: "Good morning" },
  { hourStart: 12, hourEnd: 17, icon: <FiSun size={18} />, text: "Good afternoon" },
  { hourStart: 18, hourEnd: 21, icon: <FiSunset size={18} />, text: "Good evening" },
  { hourStart: 22, hourEnd: 4, icon: <FiMoon size={18} />, text: "Good night" },
];

const financeFacts = [
  "The average person spends about 10% of their income on coffee.",
  "Saving just $5 a day can grow to over $1,800 in a year.",
  "The world's first ATM was installed in 1967 in London.",
  "About 90% of millionaires have a budget.",
  "The word 'budget' comes from the French word 'bougette' meaning a small bag.",
  "People who track their expenses save 15% more on average.",
  "The most common expense in Pakistan is food, followed by transportation.",
  "Investing $100 a month at 8% return could grow to over $150,000 in 30 years.",
  "The first credit card was introduced in 1950 by Diners Club.",
  "More than 60% of people don't have a budget.",
  "The average household spends about 30% of its income on housing.",
  "Saving 10% of your income is a good starting point for building wealth.",
  "The concept of compound interest is called the eighth wonder of the world.",
  "A typical smartphone costs more than the average monthly rent in many cities.",
  "The global average savings rate is around 20% of income.",
];

export default function DashboardNavbar({ user }: DashboardNavbarProps) {
  const { activeTheme, changeTheme } = useTheme();
  const { currency, setCurrency } = useCurrency();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [dynamicGreeting, setDynamicGreeting] = useState<{
    icon: React.ReactNode;
    text: string;
  } | null>(null);
  const [dynamicFact, setDynamicFact] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      const hour = new Date().getHours();
      const greeting = timeGreetings.find(
        (g) => {
          if (g.hourStart <= g.hourEnd) {
            return hour >= g.hourStart && hour < g.hourEnd;
          } else {
            return hour >= g.hourStart || hour < g.hourEnd;
          }
        }
      ) || timeGreetings[0];

      const randomFact = financeFacts[Math.floor(Math.random() * financeFacts.length)];

      setDynamicGreeting({ icon: greeting.icon, text: greeting.text });
      setDynamicFact(randomFact);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user?.id) {
      notificationService
        .getAll()
        .then((res) => setNotifications(res.notifications))
        .catch((err) => console.error("Failed to load notifications:", err));
    }
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyOpen(false);
        setIsThemeOpen(false);
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error(error);
    }
  };

  const getThemeIcon = () => {
    if (activeTheme === "light") return <FiSun size={16} />;
    if (activeTheme === "dark") return <FiMoon size={16} />;
    return <FiMonitor size={16} />;
  };

  const activeCurrencyDetails = CURRENCY_OPTIONS.find((c) => c.code === currency);

  const displayGreetingName = user?.name ? user.name.split(" ")[0] : "User";
  const formattedDate = isMounted
    ? new Date().toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "";

  if (!isMounted) {
    return <header className={styles.topNavbarBlankPlaceholder} />;
  }

  return (
    <header className={styles.topNavbar} suppressHydrationWarning>
      
      {/* LEFT SECTION: USER GREETING DECK */}
      <div className={styles.welcomeSection}>
        <h2 className={styles.greetingTitle}>
          {dynamicGreeting ? (
            <>
              <span className={styles.greetingIcon}>{dynamicGreeting.icon}</span>
              {dynamicGreeting.text},{" "}
            </>
          ) : (
            "Welcome, "
          )}
          <span className={styles.userName}>{displayGreetingName}</span>
        </h2>
        <div className={styles.metaRow}>
          <p className={styles.dateSubtext}>{formattedDate}</p>
          {dynamicFact && (
            <>
              <span className={styles.factSeparator}>•</span>
              <div className={styles.factSubtextWrapper}>
                <p className={styles.factSubtext} title="Fun finance fact">
                  <FiStar size={12} className={styles.factIcon} />
                  {dynamicFact}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: SYSTEM PREFERENCE TRIGGERS */}
      <div className={styles.actionControlDeck} ref={dropdownRef}>
        
        {/* CURRENCY DROPDOWN */}
        <div className={styles.dropdownMenuContainer}>
          <button
            className={styles.currencyToggleTrigger}
            onClick={() => {
              setIsCurrencyOpen(!isCurrencyOpen);
              setIsThemeOpen(false);
              setIsNotificationOpen(false);
            }}
            aria-label="Change currency"
            aria-expanded={isCurrencyOpen}
          >
            <span className={styles.utilityFlagInline}>{activeCurrencyDetails?.flag}</span>
            <span className={styles.currencyCodeLabel}>
              {activeCurrencyDetails?.code} <span className={styles.currencyMutedSymbol}>({activeCurrencyDetails?.symbol})</span>
            </span>
          </button>

          {isCurrencyOpen && (
            <div className={styles.dropdownMenuFrame}>
              <div className={styles.dropdownMenuHeader}>Dashboard Currency</div>
              <ul className={styles.dropdownScrollableContainer}>
                {CURRENCY_OPTIONS.map((option) => (
                  <li key={option.code}>
                    <button
                      onClick={() => {
                        setCurrency(option.code);
                        setIsCurrencyOpen(false);
                      }}
                      className={option.code === currency ? styles.activeMenuOption : ""}
                    >
                      <span className={styles.currencyMenuFlag}>{option.flag}</span>
                      <span className={styles.currencyMenuCode}>{option.code}</span>
                      <span className={styles.currencyMenuLabel}>{option.label}</span>
                      <span className={styles.currencyMenuSymbolBadge}>{option.symbol}</span>
                      {option.code === currency && <FiCheck className={styles.checkMarkerIcon} size={14} />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS DROPDOWN */}
        <div className={styles.dropdownMenuContainer}>
          <button
            className={`${styles.utilityIconButton} ${isNotificationOpen ? styles.iconButtonActive : ""}`}
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsThemeOpen(false);
              setIsCurrencyOpen(false);
            }}
            aria-label="Notifications"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadgeCount}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className={styles.notificationDropdownMenuFrame}>
              <div className={styles.notificationHeader}>
                <div className={styles.notificationTitleRow}>
                  <span className={styles.dropdownMenuHeaderTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className={styles.unreadPill}>{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button className={styles.markAllReadBtn} onClick={handleMarkAllAsRead}>
                    <FiCheckCircle size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className={styles.notificationScrollableContainer}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyNotificationState}>
                    <FiCheckCircle size={28} className={styles.emptyIcon} />
                    <p>You are all caught up!</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`${styles.notificationCard} ${!notification.isRead ? styles.notificationCardUnread : ""}`}
                      onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                    >
                      <div className={styles.notificationIconWrapper}>
                        {getNotificationIcon(notification.sourceType)}
                      </div>
                      <div className={styles.notificationContent}>
                        <div className={styles.notificationTopRow}>
                          <p className={styles.notificationCardTitle}>{notification.title}</p>
                          <span className={styles.notificationTime}>{timeAgo(notification.createdAt)}</span>
                        </div>
                        <p className={styles.notificationCardMessage}>{notification.message}</p>
                      </div>
                      {!notification.isRead && <div className={styles.unreadIndicatorDot} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* THEME DROPDOWN */}
        <div className={styles.dropdownMenuContainer}>
          <button
            className={`${styles.utilityIconButton} ${isThemeOpen ? styles.iconButtonActive : ""}`}
            onClick={() => {
              setIsThemeOpen(!isThemeOpen);
              setIsCurrencyOpen(false);
              setIsNotificationOpen(false);
            }}
            aria-label="Change color theme"
            aria-expanded={isThemeOpen}
          >
            {getThemeIcon()}
          </button>

          {isThemeOpen && (
            <div className={styles.themeDropdownMenuFrame}>
              <div className={styles.dropdownMenuHeader}>Interface Theme</div>
              <ul className={styles.themeOptionsList}>
                <li>
                  <button
                    onClick={() => {
                      changeTheme("light");
                      setIsThemeOpen(false);
                    }}
                    className={activeTheme === "light" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiSun size={14} /> <span>Light</span>
                    </div>
                    {activeTheme === "light" && <FiCheck className={styles.checkMarkerIcon} size={14} />}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      changeTheme("dark");
                      setIsThemeOpen(false);
                    }}
                    className={activeTheme === "dark" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiMoon size={14} /> <span>Dark</span>
                    </div>
                    {activeTheme === "dark" && <FiCheck className={styles.checkMarkerIcon} size={14} />}
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => {
                      changeTheme("system");
                      setIsThemeOpen(false);
                    }}
                    className={activeTheme === "system" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiMonitor size={14} /> <span>System</span>
                    </div>
                    {activeTheme === "system" && <FiCheck className={styles.checkMarkerIcon} size={14} />}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* MOBILE MENU TOGGLE */}
        <button
          className={styles.hamburgerMenuIconToggle}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation options menu"
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* MOBILE DRAWER WITH BACKDROP */}
      {isMobileMenuOpen && (
        <>
          <div className={styles.mobileBackdrop} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={styles.mobileNavigationDrawerTray}>
            <div className={styles.mobileDrawerWrapper}>
              
              <div className={styles.mobileDrawerGroupItem}>
                <p className={styles.mobileLabelHeader}>Global System Currency</p>
                <div className={styles.mobileButtonLayoutGridRow}>
                  {CURRENCY_OPTIONS.map((cur) => (
                    <button
                      key={cur.code}
                      className={cur.code === currency ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                      onClick={() => {
                        setCurrency(cur.code);
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <span className={styles.mobileFlagIcon}>{cur.flag}</span> 
                      {cur.code} <span className={styles.mobileCurrencySymbol}>({cur.symbol})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.mobileDrawerDivider} />

              <div className={styles.mobileDrawerGroupItem}>
                <p className={styles.mobileLabelHeader}>Interface Theme</p>
                <div className={styles.mobileButtonLayoutGridRow}>
                  <button
                    onClick={() => {
                      changeTheme("light");
                      setIsMobileMenuOpen(false);
                    }}
                    className={activeTheme === "light" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                  >
                    <FiSun size={14} /> Light
                  </button>
                  <button
                    onClick={() => {
                      changeTheme("dark");
                      setIsMobileMenuOpen(false);
                    }}
                    className={activeTheme === "dark" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                  >
                    <FiMoon size={14} /> Dark
                  </button>
                  <button
                    onClick={() => {
                      changeTheme("system");
                      setIsMobileMenuOpen(false);
                    }}
                    className={activeTheme === "system" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                  >
                    <FiMonitor size={14} /> System
                  </button>
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </header>
  );
}