"use client";

/* === SECTION 1: IMPORTS === */
import React, { useState } from "react";
import styles from "./PainPointsQuiz.module.css";
/* === SECTION 1 END === */

/* === SECTION 2: TYPES & CONSTANTS === */
type QuizOption = {
  id: string;
  label: string;
  feature: string;
  fix: string;
};

const QUIZ_OPTIONS: QuizOption[] = [
  {
    id: 'subscriptions',
    label: 'Hidden subscriptions keep taking money from my account.',
    feature: 'Subscription Finder',
    fix: 'Finds your forgotten repeating bills and alerts you before a free trial ends.'
  },
  {
    id: 'overspending',
    label: 'My money vanishes by the middle of the month.',
    feature: 'Bill Spike Tracker',
    fix: 'Monitors your monthly bills and warns you immediately if a price jumps.'
  },
  {
    id: 'splits',
    label: 'Keeping track of regular family bills gets confusing.',
    feature: 'Family Bill Manager',
    fix: 'Organizes shared household utilities into simple, easy-to-read group balances.'
  },
  {
    id: 'analytics',
    label: 'Splitting group dinner or friendly outings is a headache.',
    feature: 'Instant Bill Splitter',
    fix: 'Splits group costs among 4 friends or family members and sends fast payment reminders.'
  }
];

export default function PainPointsQuizSection() {
  /* === SECTION 3: STATE INITIALIZATION === */
  const [selectedOption, setSelectedOption] = useState<QuizOption | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  /* === SECTION 3 END === */
  
  /* === SECTION 4: HELPER FUNCTIONS === */
  const getActiveFocus = () => {
    return selectedOption?.id ?? hoveredOption;
  };

  const handleSelect = (option: QuizOption) => {
    setSelectedOption(option);
  };

  const handleHoverStart = (optionId: string) => {
    setHoveredOption(optionId);
  };

  const handleHoverEnd = () => {
    setHoveredOption(null);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setHoveredOption(null);
  };
  /* === SECTION 4 END === */

  const activeFocus = getActiveFocus();

  /* === SECTION 5: MAIN JSX RENDER LAYOUT === */

  return (
    <section className={styles.sectionContainer}>
      <div className={styles.layoutGridContainer}>
        
        <div className={styles.leftColumn}>
          <div className={`${styles.quizCard} ${selectedOption ? styles.quizCardActive : ''}`}>
            {!selectedOption ? (
              <>
                <div className={styles.metaRow}>
                  <span className={styles.badge}>Quick Budget Check</span>
                </div>
                <h3 className={styles.cardHeading}>What is your biggest money headache right now?</h3>
                <p className={styles.cardSubtext}>Pick a problem below to see how our dashboard fixes it for you automatically.</p>
                
                <div className={styles.optionsStack}>
                  {QUIZ_OPTIONS.map((opt) => (
                    <button 
                      key={opt.id} 
                      className={`${styles.optionButton} ${activeFocus === opt.id ? styles.optionButtonActive : ''}`}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => handleHoverStart(opt.id)}
                      onMouseLeave={handleHoverEnd}
                    >
                      <span className={styles.bullet}>→</span>
                      <span className={styles.buttonText}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className={styles.resultView}>
                  <div className={styles.metaRow}>
                    <span className={styles.successBadge}>Solution Found</span>
                  </div>
                  <h3 className={styles.cardHeading}>Your Feature Solution</h3>
                  
                  <div className={styles.solutionTextWrapper}>
                    <label className={styles.boxLabel}>Dashboard Tool</label>
                    <h4 className={styles.featureTitle}>{selectedOption.feature}</h4>
                    <p className={styles.fixDescription}>{selectedOption.fix}</p>
                  </div>

                  <button className={styles.resetButtonBox} onClick={handleReset}>
                    <span className={styles.resetBullet}>←</span> Look at other problems
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.matrixBrowserWindow}>
            
            <div className={styles.browserHeaderToolbar}>
              <div className={styles.dotsControlCluster}>
                <span className={styles.dotRed}></span>
                <span className={styles.dotYellow}></span>
                <span className={styles.dotGreen}></span>
              </div>
              <div className={styles.appTitleText}>Live Feature Preview</div>
            </div>

            <div className={styles.matrixGridContainer}>
              
              {/* QUADRANT 1 */}
              <div className={`${styles.quadrantBox} ${activeFocus === 'subscriptions' ? styles.quadrantHighlighted : ''}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>✦</span>
                  <span className={styles.quadTitleLabel}>Q1 // Subscription Finder</span>
                </div>
                
                <div className={styles.subWasteTrackingLayout}>
                  <div className={styles.wasteCircleAnalyticsProgress}>
                    <span className={styles.wasteCountNumber}>3 Hidden</span>
                    <span className={styles.wasteSubtextLabel}>Unused Plans</span>
                  </div>
                  <div className={styles.ghostSubscriptionRowsStack}>
                    <div className={styles.ghostSubItemRow}>
                      <span className={styles.ghostSubNameLabel}>Cloud Storage Pro</span>
                      <span className={styles.reminderActionBadgeAlert}>Cancel Alert</span>
                    </div>
                    <div className={styles.ghostSubItemRow}>
                      <span className={styles.ghostSubNameLabel}>Premium Design App</span>
                      <span className={styles.reminderActionBadgeTrial}>Trial Ending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUADRANT 2 */}
              <div className={`${styles.quadrantBox} ${activeFocus === 'splits' ? styles.quadrantHighlighted : ''}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>⇄</span>
                  <span className={styles.quadTitleLabel}>Q2 // Family Bill Manager</span>
                </div>
                
                <div className={styles.familySyncHubProfilesStack}>
                  <div className={styles.familyProfileProgressItem}>
                    <div className={styles.familyRowMetaLabels}>
                      <span className={styles.familyNameText}>Mom (Shared Groceries)</span>
                      <span className={styles.familyBalanceValue}>$93.33 Owed</span>
                    </div>
                    <div className={styles.syncMeterTrackBarBase}>
                      <div className={styles.syncMeterActiveIndicatorFillBlue} style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div className={styles.familyProfileProgressItem}>
                    <div className={styles.familyRowMetaLabels}>
                      <span className={styles.familyNameText}>Dad (Phone Group Plan)</span>
                      <span className={styles.familyBalanceValue}>$45.00 Owed</span>
                    </div>
                    <div className={styles.syncMeterTrackBarBase}>
                      <div className={styles.syncMeterActiveIndicatorFillBlue} style={{ width: '40%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* QUADRANT 3 */}
              <div className={`${styles.quadrantBox} ${activeFocus === 'overspending' ? styles.quadrantHighlighted : ''}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>⚠</span>
                  <span className={styles.quadTitleLabel}>Q3 // Bill Spike Tracker</span>
                </div>
                
                <div className={styles.anomalyChartTrackerInternalLayout}>
                  <div className={styles.anomalyGlowWarningStatusBar}>
                    <span className={styles.spikeAlertLabelHeading}>Electric Bill Price Jump</span>
                    <span className={styles.spikePercentageIndicatorNumber}>+34%</span>
                  </div>
                  <div className={styles.miniChartVisualizationPlaceholderArea}>
                    <div className={styles.barGraphicNode} style={{ height: '40%' }}></div>
                    <div className={styles.barGraphicNode} style={{ height: '45%' }}></div>
                    <div className={styles.barGraphicNode} style={{ height: '52%' }}></div>
                    <div className={`${styles.barGraphicNode} ${styles.barGraphicNodeSpiked}`} style={{ height: '88%' }}></div>
                  </div>
                </div>
              </div>

              {/* QUADRANT 4 */}
              <div className={`${styles.quadrantBox} ${activeFocus === 'analytics' ? styles.quadrantHighlighted : ''}`}>
                <div className={styles.quadMetaHeader}>
                  <span className={styles.quadIconCode}>⚿</span>
                  <span className={styles.quadTitleLabel}>Q4 // Instant Bill Splitter</span>
                </div>
                
                <div className={styles.splitPipelineContainer}>
                  <div className={styles.pipelineCardItem}>
                    <div className={styles.pipelineMetaDetails}>
                      <span className={styles.billOriginLabel}>Wi-Fi & Media</span>
                      <span className={styles.rawBillTotalAmount}>$60.00</span>
                    </div>
                    <div className={styles.pipelineActionRow}>
                      <span className={styles.splitTargetAllocationBadge} data-group="family">Family // $15 ea</span>
                      <span className={styles.sendInvoiceTriggerLink}>Send</span>
                    </div>
                  </div>

                  <div className={styles.pipelineCardItem}>
                    <div className={styles.pipelineMetaDetails}>
                      <span className={styles.billOriginLabel}>Friday Dinner</span>
                      <span className={styles.rawBillTotalAmount}>$160.00</span>
                    </div>
                    <div className={styles.pipelineActionRow}>
                      <span className={styles.splitTargetAllocationBadge} data-group="friends">Friends // $40 ea</span>
                      <span className={styles.sendInvoiceTriggerLink}>Send</span>
                    </div>
                  </div>

                  <div className={styles.pipelineCardItem}>
                    <div className={styles.pipelineMetaDetails}>
                      <span className={styles.billOriginLabel}>Road Trip Fuel</span>
                      <span className={styles.rawBillTotalAmount}>$45.00</span>
                    </div>
                    <div className={styles.pipelineActionRow}>
                      <span className={styles.splitTargetAllocationBadge} data-group="friends">Roommates // $15 ea</span>
                      <span className={styles.sendInvoiceTriggerLink}>Send</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}