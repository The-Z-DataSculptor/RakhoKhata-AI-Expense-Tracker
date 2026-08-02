// src/components/layout/DashboardNavbar.tsx
"use client";

import React, { useState, useSyncExternalStore, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
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
  FiCheckCircle,
  FiCamera,
  FiLoader,
  FiChevronDown,
  FiMail,
} from "react-icons/fi";
import { useTheme } from "@/hooks/useTheme";
import { useCurrency } from "@/app/(dashboard)/context/CurrencyContext";
import { useUser } from "@/app/(dashboard)/context/UserContext";
import { notificationService, userService, Notification, UserProfile } from "@/utils/api";
import { WORLD_CURRENCIES } from "@/constants/geoData";
import styles from "./DashboardNavbar.module.css";

const FINANCE_FACTS = [
  "The average person spends about 10% of their income on coffee.",
  "Saving just $5 a day can grow to over $1,800 in a year.",
  "The world's first ATM was installed in 1967 in London.",
  "About 90% of millionaires have a budget.",
  "The word 'budget' comes from the French word 'bougette' meaning a small bag.",
  "People who track their expenses save 15% more on average.",
  "Investing $100 a month at 8% return could grow to over $150,000 in 30 years.",
  "More than 60% of people don't have a budget.",
] as const;

interface DashboardNavbarProps {
  user?: Partial<UserProfile> | null;
  currentWorkspaceId?: string;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  if (isNaN(date.getTime())) return "Recently";
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
    case "BILL_REMINDER":
      return <FiCalendar size={18} className={styles.iconBill} />;
    case "BUDGET_ALERT":
      return <FiAlertCircle size={18} className={styles.iconAlert} />;
    case "VERIFICATION_REMINDER":
      return <FiMail size={18} className={styles.iconSystem} />;
    default:
      return <FiInfo size={18} className={styles.iconSystem} />;
  }
}

const emptySubscribe = () => () => {};

export default function DashboardNavbar({ user: propUser, currentWorkspaceId }: DashboardNavbarProps) {
  const { user: liveUser, updateUserInState } = useUser();
  const user = liveUser || propUser;

  const { activeTheme, changeTheme } = useTheme();
  const { currency, setCurrencyWithWorkspace } = useCurrency();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [isThemeOpen, setIsThemeOpen] = useState<boolean>(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMobileCurrencyOpen, setIsMobileCurrencyOpen] = useState<boolean>(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState<boolean>(false);

  const currentAvatarUrl = user?.avatarUrl ?? null;
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length;

  const [dynamicGreeting, setDynamicGreeting] = useState<{
    icon: React.ReactNode;
    text: string;
  } | null>(null);
  const [dynamicFact, setDynamicFact] = useState<string>("");

  useEffect(() => {
    const animationFrameId = requestAnimationFrame(() => {
      const hour = new Date().getHours();
      let text = "Good morning";
      let icon = <FiSunrise size={18} />;

      if (hour >= 12 && hour < 18) {
        text = "Good afternoon";
        icon = <FiSun size={18} />;
      } else if (hour >= 18 && hour < 22) {
        text = "Good evening";
        icon = <FiSunset size={18} />;
      } else if (hour >= 22 || hour < 5) {
        text = "Good night";
        icon = <FiMoon size={18} />;
      }

      const randomIndex = Math.floor(Math.random() * FINANCE_FACTS.length);
      setDynamicGreeting({ icon, text });
      setDynamicFact(FINANCE_FACTS[randomIndex]);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    let isMountedFlag = true;
    if (user?.id) {
      notificationService
        .getAll()
        .then((res) => {
          if (isMountedFlag) {
            setNotifications(Array.isArray(res.notifications) ? res.notifications : []);
          }
        })
        .catch((err) => console.error("Failed to load notifications:", err));
    }
    return () => {
      isMountedFlag = false;
    };
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

  const handleAvatarClick = () => {
    if (!isAvatarUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format. Please upload an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Image is too large. Max size allocation limit is 3MB.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      setIsAvatarUploading(true);
      const data = await userService.uploadAvatar(formData);
      updateUserInState({ avatarUrl: data.avatarUrl });
      toast.success("Profile avatar updated successfully!");
    } catch (error: unknown) {
      console.error("Avatar Upload Exception Loop:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to modify profile image asset.";
      toast.error(errorMessage);
    } finally {
      setIsAvatarUploading(false);
      event.target.value = "";
    }
  };

  const handleMarkAsRead = async (id: string, isRead: boolean) => {
    if (isRead) return;
    try {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleResendVerification = async () => {
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const errorMsg =
          typeof data === "object" && data !== null && "error" in data
            ? (data as { error: string }).error
            : "Failed to resend verification email.";
        throw new Error(errorMsg);
      }
      toast.success("Verification email sent! Check your inbox.");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      toast.error(message);
    }
  };

  const getThemeIcon = () => {
    if (activeTheme === "light") return <FiSun size={16} />;
    if (activeTheme === "dark") return <FiMoon size={16} />;
    return <FiMonitor size={16} />;
  };

  const activeCurrencyDetails = WORLD_CURRENCIES.find(
    (c) => c.code.toUpperCase() === currency?.toUpperCase()
  );
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
    <header className={styles.topNavbar} suppressHydrationWarning aria-label="Dashboard Top Bar">
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

      <div className={styles.actionControlDeck} ref={dropdownRef}>
        {/* Currency Dropdown */}
        <div className={styles.dropdownMenuContainer}>
          <button
            type="button"
            className={styles.currencyToggleTrigger}
            onClick={() => {
              setIsCurrencyOpen(!isCurrencyOpen);
              setIsThemeOpen(false);
              setIsNotificationOpen(false);
            }}
            aria-label="Change currency"
            aria-expanded={isCurrencyOpen}
          >
            <span className={styles.utilityFlagInline}>
              {activeCurrencyDetails?.flag || "💸"}
            </span>
            <span className={styles.currencyCodeLabel}>
              {activeCurrencyDetails?.code || currency || "Custom"}{" "}
              <span className={styles.currencyMutedSymbol}>
                ({activeCurrencyDetails?.symbol || ""})
              </span>
            </span>
          </button>

          {isCurrencyOpen && (
            <div className={styles.dropdownMenuFrame} role="menu">
              <div className={styles.dropdownMenuHeader}>Dashboard Currency</div>
              <ul className={styles.dropdownScrollableContainer}>
                {WORLD_CURRENCIES.map((option) => (
                  <li key={option.code}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setCurrencyWithWorkspace(option.code, currentWorkspaceId || "");
                        setIsCurrencyOpen(false);
                      }}
                      className={
                        option.code.toUpperCase() === currency?.toUpperCase()
                          ? styles.activeMenuOption
                          : ""
                      }
                    >
                      <span className={styles.currencyMenuFlag}>{option.flag}</span>
                      <span className={styles.currencyMenuCode}>{option.code}</span>
                      <span className={styles.currencyMenuLabel}>{option.label}</span>
                      <span className={styles.currencyMenuSymbolBadge}>{option.symbol}</span>
                      {option.code.toUpperCase() === currency?.toUpperCase() && (
                        <FiCheck className={styles.checkMarkerIcon} size={14} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Notification Dropdown */}
        <div className={styles.dropdownMenuContainer}>
          <button
            type="button"
            className={`${styles.utilityIconButton} ${isNotificationOpen ? styles.iconButtonActive : ""}`}
            onClick={() => {
              setIsNotificationOpen(!isNotificationOpen);
              setIsThemeOpen(false);
              setIsCurrencyOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={isNotificationOpen}
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className={styles.notificationBadgeCount}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className={styles.notificationDropdownMenuFrame} role="menu">
              <div className={styles.notificationHeader}>
                <div className={styles.notificationTitleRow}>
                  <span className={styles.dropdownMenuHeaderTitle}>Notifications</span>
                  {unreadCount > 0 && (
                    <span className={styles.unreadPill}>{unreadCount} new</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    className={styles.markAllReadBtn}
                    onClick={handleMarkAllAsRead}
                  >
                    <FiCheckCircle size={14} /> Mark all read
                  </button>
                )}
              </div>

              <div className={styles.notificationScrollableContainer}>
                {safeNotifications.length === 0 ? (
                  <div className={styles.emptyNotificationState}>
                    <FiCheckCircle size={28} className={styles.emptyIcon} />
                    <p>You are all caught up!</p>
                  </div>
                ) : (
                  safeNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`${styles.notificationCard} ${
                        !notification.isRead ? styles.notificationCardUnread : ""
                      }`}
                      onClick={() => handleMarkAsRead(notification.id, notification.isRead)}
                    >
                      <div className={styles.notificationIconWrapper}>
                        {getNotificationIcon(notification.sourceType)}
                      </div>
                      <div className={styles.notificationContent}>
                        <div className={styles.notificationTopRow}>
                          <p className={styles.notificationCardTitle}>{notification.title}</p>
                          <span className={styles.notificationTime}>
                            {timeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className={styles.notificationCardMessage}>{notification.message}</p>
                        {notification.sourceType === "VERIFICATION_REMINDER" && (
                          <button
                            type="button"
                            className={styles.resendVerificationBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResendVerification();
                            }}
                          >
                            <FiMail size={12} /> Resend Verification Email
                          </button>
                        )}
                      </div>
                      {!notification.isRead && <div className={styles.unreadIndicatorDot} />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Dropdown */}
        <div className={styles.dropdownMenuContainer}>
          <button
            type="button"
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
            <div className={styles.themeDropdownMenuFrame} role="menu">
              <div className={styles.dropdownMenuHeader}>Interface Theme</div>
              <ul className={styles.themeOptionsList}>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      changeTheme("light");
                      setIsThemeOpen(false);
                    }}
                    className={activeTheme === "light" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiSun size={14} /> <span>Light</span>
                    </div>
                    {activeTheme === "light" && (
                      <FiCheck className={styles.checkMarkerIcon} size={14} />
                    )}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      changeTheme("dark");
                      setIsThemeOpen(false);
                    }}
                    className={activeTheme === "dark" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiMoon size={14} /> <span>Dark</span>
                    </div>
                    {activeTheme === "dark" && (
                      <FiCheck className={styles.checkMarkerIcon} size={14} />
                    )}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      changeTheme("system");
                      setIsThemeOpen(false);
                    }}
                    className={activeTheme === "system" ? styles.activeMenuOption : ""}
                  >
                    <div className={styles.themeLabelCluster}>
                      <FiMonitor size={14} /> <span>System</span>
                    </div>
                    {activeTheme === "system" && (
                      <FiCheck className={styles.checkMarkerIcon} size={14} />
                    )}
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Avatar Upload */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          style={{ display: "none" }}
        />

        <div
          className={`${styles.profileAvatarContainer} ${isAvatarUploading ? styles.avatarLoadingState : ""}`}
          onClick={handleAvatarClick}
          title="Click to upload custom picture"
        >
          {isAvatarUploading ? (
            <div className={styles.avatarLoadingSpinner}>
              <FiLoader size={16} className={styles.spinningLoaderIcon} />
            </div>
          ) : currentAvatarUrl ? (
            <>
              <Image
                src={currentAvatarUrl}
                alt={user?.name || "User Avatar"}
                className={styles.profileAvatarImage}
                width={38}
                height={38}
                unoptimized
              />
              <div className={styles.avatarCameraOverlay}>
                <FiCamera size={14} />
              </div>
            </>
          ) : (
            <>
              <div className={styles.avatarFallbackCircle}>
                {displayGreetingName.charAt(0)}
              </div>
              <div className={styles.avatarCameraOverlay}>
                <FiCamera size={14} />
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          className={styles.hamburgerMenuIconToggle}
          onClick={() => {
            setIsMobileMenuOpen(!isMobileMenuOpen);
            setIsMobileCurrencyOpen(false);
          }}
          aria-label="Toggle navigation options menu"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          <div className={styles.mobileBackdrop} onClick={() => setIsMobileMenuOpen(false)} />
          <div className={styles.mobileNavigationDrawerTray}>
            <div className={styles.mobileDrawerWrapper}>
              <div className={styles.mobileDrawerGroupItem}>
                <button
                  type="button"
                  className={`${styles.mobileAccordionHeader} ${isMobileCurrencyOpen ? styles.mobileAccordionHeaderActive : ""}`}
                  onClick={() => setIsMobileCurrencyOpen(!isMobileCurrencyOpen)}
                  aria-expanded={isMobileCurrencyOpen}
                >
                  <div className={styles.mobileAccordionTitleGroup}>
                    <p className={styles.mobileLabelHeader}>Global System Currency</p>
                    <span className={styles.mobileSelectedCurrencyBadge}>
                      {activeCurrencyDetails?.flag || "💸"} {activeCurrencyDetails?.code || currency || "USD"} ({activeCurrencyDetails?.symbol || "$"})
                    </span>
                  </div>
                  <FiChevronDown
                    size={18}
                    className={`${styles.mobileChevronIcon} ${isMobileCurrencyOpen ? styles.mobileChevronRotated : ""}`}
                  />
                </button>

                {isMobileCurrencyOpen && (
                  <div className={styles.mobileButtonLayoutGridRow}>
                    {WORLD_CURRENCIES.map((cur) => (
                      <button
                        key={cur.code}
                        type="button"
                        className={
                          cur.code.toUpperCase() === currency?.toUpperCase()
                            ? styles.mobileActiveActionButton
                            : styles.mobileSecondaryActionButton
                        }
                        onClick={() => {
                          setCurrencyWithWorkspace(cur.code, currentWorkspaceId || "");
                          setIsMobileCurrencyOpen(false);
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <span className={styles.mobileFlagIcon}>{cur.flag}</span>
                        {cur.code} <span className={styles.mobileCurrencySymbol}>({cur.symbol})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.mobileDrawerDivider} />

              <div className={styles.mobileDrawerGroupItem}>
                <p className={styles.mobileLabelHeader}>Interface Theme</p>
                <div className={styles.mobileButtonLayoutGridRow}>
                  <button
                    type="button"
                    onClick={() => {
                      changeTheme("light");
                      setIsMobileMenuOpen(false);
                    }}
                    className={activeTheme === "light" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                  >
                    <FiSun size={14} /> Light
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      changeTheme("dark");
                      setIsMobileMenuOpen(false);
                    }}
                    className={activeTheme === "dark" ? styles.mobileActiveActionButton : styles.mobileSecondaryActionButton}
                  >
                    <FiMoon size={14} /> Dark
                  </button>
                  <button
                    type="button"
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