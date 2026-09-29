//! Core types for Ferret: hops on the money trail, labels for where it landed,
//! and the shares that go into the headline ("79% of it reached an exchange").

use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Chain {
    Bitcoin,
    Ethereum,
    Tron,
    BnbChain,
    Solana,
}

/// One transfer on the trail, as it appears on a line of the statement.
#[derive(Debug, Clone)]
pub struct Hop {
    pub chain: Chain,
    pub tx: String,
    pub from: String,
    pub to: String,
    pub asset: String,
    /// Amount in the asset's smallest unit (for USDT, millionths).
    pub amount: u128,
    /// Unix time of the block, UTC.
    pub time: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LabelKind {
    ExchangeDeposit,
    Mixer,
    Bridge,
    Sanctioned,
    ReportedScam,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Confidence {
    Low,
    Medium,
    High,
}

/// What Ferret thinks an address is, where that came from, and how sure it is.
#[derive(Debug, Clone)]
pub struct Label {
    pub kind: LabelKind,
    pub entity: String,
    pub source: String,
    pub confidence: Confidence,
}

impl Label {
    /// Only an exchange deposit address leads to an account the police can ask about.
    pub fn can_freeze(&self) -> bool {
        self.kind == LabelKind::ExchangeDeposit && self.confidence >= Confidence::Medium
    }
}

impl fmt::Display for Confidence {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(match self {
            Confidence::Low => "Low",
            Confidence::Medium => "Medium",
            Confidence::High => "High",
        })
    }
}

/// Whole-percent share of the traced total, rounded half up.
pub fn share(amount: u128, total: u128) -> u8 {
    if total == 0 {
        return 0;
    }
    ((amount * 200 + total) / (total * 2)) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    const USDT: u128 = 1_000_000;

    #[test]
    fn shares_match_the_headline() {
        let total = 12_400 * USDT;
        assert_eq!(share(9_850 * USDT, total), 79);
        assert_eq!(share(1_900 * USDT, total), 15);
        assert_eq!(share(650 * USDT, total), 5);
        assert_eq!(share(1, 0), 0);
    }

    #[test]
    fn only_confident_deposit_labels_can_freeze() {
        let deposit = Label {
            kind: LabelKind::ExchangeDeposit,
            entity: "Kestrel Exchange".into(),
            source: "Open labelled dataset".into(),
            confidence: Confidence::High,
        };
        let mixer = Label {
            kind: LabelKind::Mixer,
            ..deposit.clone()
        };
        let unsure = Label {
            confidence: Confidence::Low,
            ..deposit.clone()
        };
        assert!(deposit.can_freeze());
        assert!(!mixer.can_freeze());
        assert!(!unsure.can_freeze());
        assert_eq!(deposit.confidence.to_string(), "High");
    }
}
