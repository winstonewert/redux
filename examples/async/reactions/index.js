import {receivePosts} from '../actions'
import fetch from 'isomorphic-fetch'

function fetchReddit(reddit) {
    return {
        type: 'JSON_API',
        url: `http://www.reddit.com/r/${reddit}.json`,
        onSuccess: (json) => receivePosts(reddit, json)
    };
}

function reactions(state) {
    var posts = state.postsByReddit[state.selectedReddit];
    if (!posts || posts.didInvalidate) {
        return [fetchReddit(state.selectedReddit)];
    } else {
        return [];
    }
}

export default function doReactions(store) {
    var currentJsonRequests = {};
    function updateReactions() {
        var oldJsonRequests = {};
        currentJsonRequests = {};
        for (var reaction of reactions(store.getState())) {
            var existingRequest = currentJsonRequests[reaction.url];
            if (existingRequest) {
                // This a request that we already started, keep it.
                currentJsonRequests[reaction.url] = existingRequest;
                delete oldJsonRequests[reaction.url];
            } else {
                // This is a new request, start it.
                var xhr = new XMLHttpRequest();
                xhr.addEventListener("load", () => {
                    store.dispatch(reaction.onSuccess(JSON.parse(xhr.responseText)));
                });
                xhr.open("GET", reaction.url);
                xhr.send();
                currentJsonRequests[reaction.url] = xhr;
            }
        }
        for (var url in oldJsonRequests) {
            try {
                // This request was started, but is no longer wanted, cancel it.
                oldJsonRequests[url].abort();
            } catch (error) {
                // If the request already finished, we cannot cancel.
            }
        }
    }
    store.subscribe(() => updateReactions());
    updateReactions();
}

