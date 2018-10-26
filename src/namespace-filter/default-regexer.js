export default function defaultRegexer(namespaces) {
  // Set(["app:*", "sics:server", "sics:graphqlResponseHandler"])
  //   => ["app:*", "sics:server", "sics:graphqlResponseHandler"]
  const matches = Array.from(namespaces);

  // ["app:*", "sics:server", "sics:whatever"]
  //   => ["app:*", "sics:*", "sics:*"]
  const matched = matches.map(
    (m) => m.replace(/:.*?$/, ':*'));

  // ["app:*", "sics:*", "sics:*"]
  //   => ["app:*", "sics:*"]
  const filtered = matched.filter(
    (v, i, self) => self.indexOf(v) === i);

  // ["app:*", "sics:server", "sics:whatever"] + ["app:*", "sics:*"]
  //   => ["app:*,", "sics:server,", "sics:whatever", "sics:*"]
  const concatenated = matches.concat(filtered).filter(
    (v, i, self) => self.indexOf(v) === i);

  // ["app:*", "sics:server", "sics:whatever", "sics:*"]
  //   => ["app:.*", "sics:server", "sics:whatever", "sics:.*"]
  const regexSemantics = concatenated.map(
    (m) => m.replace(/\*/g, '.*'));

  // ["app:.*,", "sics:server,", "sics:whatever", "sics:.*"]
  //   => /app:.*|sics:server|sics:whatever|sics:.*/
  return (concatenated.length > 0) ? new RegExp(regexSemantics.join('|')) : new RegExp('.*');
}
