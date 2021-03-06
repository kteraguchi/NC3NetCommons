<?php
/**
 * NetCommonsBlock Component
 *
 * @author Noriko Arai <arai@nii.ac.jp>
 * @author Shohei Nakajima <nakajimashouhei@gmail.com>
 * @link http://www.netcommons.org NetCommons Project
 * @license http://www.netcommons.org/license.txt NetCommons License
 * @copyright Copyright 2014, NetCommons Project
 */

App::uses('Component', 'Controller');

/**
 * NetCommonsBlock Component
 *
 * @author Shohei Nakajima <nakajimashouhei@gmail.com>
 * @package NetCommons\NetCommons\Controller\Component
 */
class NetCommonsBlockComponent extends Component {

/**
 * status published
 *
 * @var string
 */
	const STATUS_PUBLISHED = '1';

/**
 * status approved
 *
 * @var string
 */
	const STATUS_APPROVED = '2';

/**
 * in draft status
 *
 * @var string
 */
	const STATUS_IN_DRAFT = '3';

/**
 * status disaproved
 *
 * @var string
 */
	const STATUS_DISAPPROVED = '4';

/**
 * status list for editor
 *
 * @var array
 */
	static public $statusesForEditor = array(
		self::STATUS_APPROVED,
		self::STATUS_IN_DRAFT
	);

/**
 * status list
 *
 * @var array
 */
	static public $STATUSES = array(
		self::STATUS_PUBLISHED,
		//self::STATUS_APPROVED,
		self::STATUS_IN_DRAFT,
		self::STATUS_DISAPPROVED
	);

/**
 * use components
 *
 * @var array
 */
	public $components = array(
		'NetCommons.NetCommonsFrame'
	);

/**
 * Called before the Controller::beforeFilter().
 *
 * @param Controller $controller Instantiating controller
 * @return void
 */
	public function initialize(Controller $controller) {
		$this->controller = $controller;
	}

/**
 * Function to get the data of BlockRolePermmissions.
 *    e.g.) BlockRolePermmissions controller
 *
 * @param string $blockKey blocks.key
 * @param array $permissions permissions
 * @return array Role and Permissions data
 *   - The `Role` merged of Role and RoomRole
 *   - The `Permission` sets in priority of BlockRolePermission and RoomRolePermission and DefaultRolePermission.
 */
	public function getBlockRolePermissions($blockKey, $permissions) {
		//modelのロード
		$models = array(
			'BlockRolePermission' => 'Blocks.BlockRolePermission',
			'DefaultRolePermission' => 'Roles.DefaultRolePermission',
			'Role' => 'Roles.Role',
			'RolesRoom' => 'Rooms.RolesRoom',
			'RoomRole' => 'Rooms.RoomRole',
			'RoomRolePermission' => 'Rooms.RoomRolePermission',
		);
		foreach ($models as $model => $class) {
			$this->$model = ClassRegistry::init($class, true);
		}

		//RoomRole取得
		$roomRoles = $this->RoomRole->find('all', array(
			'recursive' => -1,
		));
		$roomRoles = Hash::combine($roomRoles, '{n}.RoomRole.role_key', '{n}.RoomRole');

		//Role取得
		$roles = $this->Role->find('all', array(
			'recursive' => -1,
			'conditions' => array(
				'Role.type' => Role::ROLE_TYPE_ROOM,
				'Role.language_id' => $this->controller->viewVars['languageId'],
			),
		));
		$roles = Hash::combine($roles, '{n}.Role.key', '{n}.Role');

		//DefaultRolePermission取得
		$defaultPermissions = $this->DefaultRolePermission->find('all', array(
			'recursive' => -1,
			'conditions' => array(
				'DefaultRolePermission.permission' => $permissions,
			),
		));
		$defaultPermissions = Hash::combine(
			$defaultPermissions,
			'{n}.DefaultRolePermission.role_key',
			'{n}.DefaultRolePermission',
			'{n}.DefaultRolePermission.permission'
		);
		$defaultPermissions = Hash::remove($defaultPermissions, '{s}.{s}.id');

		//RolesRoomのIDリストを取得
		$rolesRooms = $this->RolesRoom->find('list', array(
			'recursive' => -1,
			'conditions' => array(
				'RolesRoom.room_id' => $this->controller->viewVars['roomId'],
			),
		));

		//RoomRolePermission取得
		$roomRolePermissions = $this->RoomRolePermission->find('all', array(
			'recursive' => 0,
			'conditions' => array(
				'RoomRolePermission.roles_room_id' => $rolesRooms,
				'RoomRolePermission.permission' => $permissions,
			),
		));
		$roomRolePermissions = Hash::combine(
			$roomRolePermissions,
			'{n}.RolesRoom.role_key',
			'{n}.RoomRolePermission',
			'{n}.RoomRolePermission.permission'
		);
		$roomRolePermissions = Hash::remove($roomRolePermissions, '{s}.{s}.id');

		//BlockRolePermission取得
		$blockPermissions = $this->BlockRolePermission->find('all', array(
			'recursive' => 0,
			'conditions' => array(
				'BlockRolePermission.roles_room_id' => $rolesRooms,
				'BlockRolePermission.block_key' => $blockKey,
				'BlockRolePermission.permission' => $permissions,
			),
		));
		$blockPermissions = Hash::combine(
			$blockPermissions,
			'{n}.RolesRoom.role_key',
			'{n}.BlockRolePermission',
			'{n}.BlockRolePermission.permission'
		);

		//戻り値の設定
		$results = array(
			'BlockRolePermissions' => Hash::merge($defaultPermissions, $roomRolePermissions, $blockPermissions),
			'Roles' => Hash::merge($roomRoles, $roles)
		);
		return $results;
	}

/**
 * Validate blockId on request data
 *
 * @return mixed true on success, false on failure
 */
	public function validateBlockId() {
		if (! isset($this->controller->params['pass'][1]) || (int)$this->controller->params['pass'][1] === 0) {
			return false;
		}
		if ($this->controller->request->isGet()) {
			return true;
		}

		if (! isset($this->controller->data['Block']['id']) || (int)$this->controller->data['Block']['id'] === 0) {
			return true;
		}
		//POSTのblockIdとGETのblockIdのチェック
		if ((int)$this->controller->data['Block']['id'] !== (int)$this->controller->params['pass'][1]) {
			return false;
		}
		return true;
	}

}
