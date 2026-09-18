const axios = require('axios');

const LINKEDIN_ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;
const LINKEDIN_PROFILE_ID = process.env.LINKEDIN_PROFILE_ID;

async function postToLinkedIn(postContent) {
  try {
    // First, get the member profile URN
    const profileResponse = await axios.get(
      'https://api.linkedin.com/v2/me',
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const memberId = profileResponse.data.id;
    const memberUrn = `urn:li:member:${memberId}`;

    console.log(`📤 Posting as: ${memberUrn}`);

    // Post to LinkedIn
    const response = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      {
        author: memberUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: postContent
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Posted to LinkedIn successfully!');
    console.log('Post ID:', response.data.id);
    return response.data.id;
  } catch (error) {
    console.error('❌ Error posting to LinkedIn:', error.response?.data || error.message);
    throw error;
  }
}

// This would be called from GitHub Actions with the approved post
const approvedPost = process.argv[2] || 'Default post if no content provided';
postToLinkedIn(approvedPost).catch(err => {
  console.error('Failed to post:', err.message);
  process.exit(1);
});
