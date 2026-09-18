const axios = require('axios');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

async function generateTrendingPost() {
  try {
    // Call Claude API to draft trending post
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-opus-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `You are a viral LinkedIn expert. Search for today's trending topics (tech, business, marketing, startup news) and draft a punchy, engaging LinkedIn post (300-400 words) that:
1. Opens with a hook that stops scrolling
2. Shares an insight or observation from trending news
3. Makes it personal/relatable 
4. Ends with a CTA (question or call to action)
5. Uses 1-2 relevant emojis only
6. Written in first person (I/me perspective)

Draft ONE post only. No preamble, just the post.`
          }
        ]
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    const draftPost = response.data.content[0].text;
    
    console.log('✅ Post drafted successfully');
    console.log('Post preview:', draftPost.substring(0, 200) + '...');
    
    return draftPost;
  } catch (error) {
    console.error('Error generating post:', error.message);
    throw error;
  }
}

async function postToSlack(post) {
  try {
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: SLACK_CHANNEL_ID,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📱 Daily LinkedIn Post - Awaiting Approval'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Posted at:* ${timestamp}\n\n${post}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '✅ Approve & Post'
                },
                value: 'approve',
                action_id: 'approve_post',
                style: 'primary'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '✏️ Edit'
                },
                value: 'edit',
                action_id: 'edit_post'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '⏭️ Skip'
                },
                value: 'skip',
                action_id: 'skip_post'
              }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: '_Click a button to proceed. Post will auto-skip in 2 hours if no action._'
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${SLACK_BOT_TOKEN}`
        }
      }
    );

    if (response.data.ok) {
      console.log('✅ Posted to Slack successfully');
      console.log('Message timestamp:', response.data.ts);
    } else {
      console.error('Slack error:', response.data.error);
      throw new Error(`Slack error: ${response.data.error}`);
    }
  } catch (error) {
    console.error('Error posting to Slack:', error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting LinkedIn Post Automation...');
  console.log(`⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })}`);
  
  try {
    const post = await generateTrendingPost();
    await postToSlack(post);
    console.log('✅ Complete! Awaiting approval in Slack.');
  } catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
  }
}

main();
