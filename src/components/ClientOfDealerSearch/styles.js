/**
 * ### Карточка покупателя
 * стили оформления
 *
 * Created by Evgeniy Malyarov on 14.03.2018.
 */

import {withStyles} from 'material-ui/styles';

const styles = theme => ({
  paper: {
    minWidth: 880,
    maxHeight: 'calc(100vh - 80px)',
  },
  entered: {
    minHeight: 120,
  },
  secondary: {
    marginTop: -theme.spacing.unit * 1.5,
  },
  groupTitle: {
    fontWeight: 'bold',
  },
  listitem: {
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
  }
});

export default withStyles(styles);
