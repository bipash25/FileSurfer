use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TokenEstimate {
    pub total_tokens: u32,
    pub char_count: usize,
    pub word_count: usize,
    pub line_count: usize,
    pub gpt4_estimate: u32,
    pub claude_estimate: u32,
    pub gemini_estimate: u32,
}

/// Estimate tokens for various AI models
/// GPT models: ~4 chars = 1 token, ~0.75 words = 1 token
/// Claude models: Similar to GPT, slightly different on special chars
pub fn estimate_tokens(text: &str) -> TokenEstimate {
    let char_count = text.len();
    let word_count = text.split_whitespace().count();
    let line_count = text.lines().count();

    // GPT-4 estimation: Average of char-based and word-based
    // More accurate formula based on actual token behavior
    let char_tokens = (char_count as f32 / 4.0) as u32;
    let word_tokens = (word_count as f32 * 1.3) as u32;
    let gpt4_estimate = ((char_tokens + word_tokens) / 2).max(1);

    // Claude estimation: Slightly more tokens for same content
    let claude_estimate = (gpt4_estimate as f32 * 1.05) as u32;

    // Gemini estimation: ~10% more efficient than GPT-4 on average for code
    let gemini_estimate = (gpt4_estimate as f32 * 0.9) as u32;

    TokenEstimate {
        total_tokens: gpt4_estimate,
        char_count,
        word_count,
        line_count,
        gpt4_estimate,
        claude_estimate,
        gemini_estimate,
    }
}

/// Batch estimate tokens for multiple files
#[allow(dead_code)]
pub fn estimate_tokens_batch(files: &[(String, String)]) -> Vec<(String, TokenEstimate)> {
    files
        .iter()
        .map(|(path, content)| (path.clone(), estimate_tokens(content)))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_token_estimation() {
        let text = "Hello world! This is a test.";
        let estimate = estimate_tokens(text);

        assert!(estimate.total_tokens > 0);
        assert!(estimate.char_count == 28);
        assert!(estimate.word_count == 6);
    }

    #[test]
    fn test_empty_string() {
        let estimate = estimate_tokens("");
        assert_eq!(estimate.total_tokens, 1); // Minimum 1 token
    }
}
