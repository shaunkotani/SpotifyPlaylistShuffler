const clientId = '94668f58b57a4c2488fded346a09f425';  // ここにSpotifyのClient IDを入れる
const redirectUri = 'https://shaunkotani.github.io/SpotifyPlaylistShuffler/';  // または公開URL

// Spotify認証スコープ
const scopes = 'playlist-read-private playlist-modify-private playlist-modify-public';

document.getElementById('loginBtn').onclick = () => {
  const url = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
  window.location.href = url;
};

// ↓ この後、callback.html でアクセストークンを受け取り、
//     取得したトークンを元にプレイリスト取得・シャッフル処理を行う

window.onload = async () => {
  const token = localStorage.getItem('spotify_token');
  if (!token) return;

  // プレイリストを取得
  const res = await fetch('https://api.spotify.com/v1/me/playlists', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();

  const playlistsDiv = document.getElementById('playlists');
  data.items.forEach(playlist => {
    const btn = document.createElement('button');
    btn.textContent = `🎵 ${playlist.name}`;
    btn.onclick = () => shuffleAndSavePlaylist(playlist.id, token);
    playlistsDiv.appendChild(btn);
  });
};

async function shuffleAndSavePlaylist(playlistId, token) {
  // 元のトラックを取得
  const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const tracks = await res.json();
  const uris = tracks.items.map(t => t.track.uri);

  // シャッフル（Fisher-Yates）
  for (let i = uris.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [uris[i], uris[j]] = [uris[j], uris[i]];
  }

  // 新しいプレイリストを作成
  const userRes = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const userData = await userRes.json();

  const createRes = await fetch(`https://api.spotify.com/v1/users/${userData.id}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'シャッフル版プレイリスト',
      description: '元のプレイリストをシャッフルして保存',
      public: false
    })
  });
  const newPlaylist = await createRes.json();

  // トラックを追加（最大100曲まで）
  await fetch(`https://api.spotify.com/v1/playlists/${newPlaylist.id}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris })
  });

  alert('新しいシャッフルプレイリストを作成しました！');
}