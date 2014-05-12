/*
    The Spotify Player manages the playing of a list of
    Echo Nest songs using Spotify 30sec samples.
*/
function getSpotifyPlayer() {
    var curSongIndex = 0;
    var curSongs = [];
    var curSong = null;
    var callback = null;
    var audio = null;
    var cache = {};

    function getSpotifyID(song) {
        var id = song.tracks[0].foreign_id;
        var rawID = id.split(':')[2];
        return rawID;
    }

    function hasTrack(song) {
        return song.tracks.length > 0;
    }

    function fetchSpotifyTrack(sid, callback) {
        var url = 'https://api.spotify.com/v1/tracks/' + sid;
        $.getJSON(url, function(track) {
            callback(track);
        });
    }

    function fetchSpotifyTracks(sids, callback) {
        var sidString = sids.join()
        var url = 'https://api.spotify.com/v1/tracks?ids=' + sidString;
        $.getJSON(url, function(results) {
            callback(results.tracks);
        });
    }

    function playSpotifyTrack(track) {
        audio.setAttribute('src', track.preview_url);
        audio.play();
    }

    function playSong(song) {
        if (hasTrack(song)) {
            curSong = song;
            var sid = getSpotifyID(song);
            playSpotifyTrack(song.spotifyTrack);
            if (callback) {
                callback(song);
            }
            $("#rp-song-title").text(song.title + " by " + song.artist_name);
            $("#rp-artist-name").text(" by " + song.artist_name);
        }
    }


    function playSongAndAdjustIndex(song) {
        playSong(song);

        for (var i = 0; i < curSongs.length; i++) {
            var csong = curSongs[i];
            if (csong.id == song.id) {
                curSongIndex = i + 1;
                break;
            }
        }
    }

    function playNextSong() {
        while (curSongIndex < curSongs.length) {
            var song = curSongs[curSongIndex++];
            if (hasTrack(song)) {
                playSong(song);
                break;
            }
        }
    }

    function playPreviousSong() {
        while (curSongIndex > 0) {
            var song = curSongs[--curSongIndex];
            if (hasTrack(song)) {
                playSong(song);
                break;
            }
        }
    }

    function startPlayingSongs(songs) {
        if (curSongs != songs) {
            curSongIndex = 0;
            curSongs = songs;
        }
        playNextSong();
    }

    function setCallback(cb) {
        callback = cb;
    }

    function addSongs(songs, readyCallback) {
        curSongIndex = 0;
        curSongs = songs;
        fetchTrackInfo(songs, readyCallback);
    }


    function fetchTrackInfo(songs, callback) {

        var sids = [];
        _.each(songs, function(song, i) {
            var sid = song.tracks[0].foreign_id.split(':')[2]
            sids.push(sid);
        });

        fetchSpotifyTracks(sids, function(tracks) {
            if (tracks.length != songs.length) {
                console.log("Mismatch of songs and tracks", songs, tracks);
            }
            _.each(tracks, function(track, i) {
                songs[i].spotifyTrack = track;
                callback(songs[i]);
            });
        });
    }

    function togglePause() {
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    }

    function paused() {
        return audio.paused;
    }

    function updateButtons() {
        if (paused()) {
            $(".icon-pause").removeClass("icon-pause").addClass("icon-play");
        } else {
            $(".icon-play").removeClass("icon-play").addClass("icon-pause");
        }
    }

    function init() {
        audio = new Audio();

        audio.addEventListener('ended', function() {
            playNextSong();
            updateButtons();
        });

        audio.addEventListener('pause', function() {
            updateButtons();
        });

        audio.addEventListener('play', function() {
            updateButtons();
        });

        $("#rp-pause-play").click(function() {
            if (curSong) {
                togglePause();
            } else {
                playNextSong();
            }
        });

        $("#rp-album-art").click(function() {
            togglePause();
        });

        $("#rp-play-next").click(function() {
            playNextSong();
        });

        $("#rp-play-prev").click(function() {
            playPreviousSong();
        });
    }

    var methods = {   
        addSongs : addSongs,
        playSong: playSongAndAdjustIndex,
        next:playNextSong,
        paused:paused,
        togglePause:togglePause,
        setCallback:setCallback
    }
    init();
    return methods;
}


