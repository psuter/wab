# OpenWhisk Activation Browser

Run:

1. `npm install -g wab`
2. `wab`

You are expected to have working OpenWhisk credentials. In particular, the file
`~/.wskprops` should exist and be complete.

If you can run `wsk activation list` without issue you are probably all set.

Note that `wab` requires Node 6 or later.

## Usage

`wab` uses Vim bindings for most operations. The following may be useful:

  * `k`/`j` moves up/down
  * `CTRL+U`/`CTRL+D` page up/page down
  * When viewing an activation, `r` toggles the "result only" view, and `l` toggles the "log only" view
  * `q` closes the activation pane, or the program
  * `CTRL+R` forces a refresh of the activation list
