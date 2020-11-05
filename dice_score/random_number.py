from iconservice import *

TAG = 'RandomNumber'

# ---------- obi -----------


def decode_int(b: bytes, n_bits: int) -> (int, bytes):
    acc = 0
    i = 0
    r = n_bits >> 3
    while i < r:
        acc <<= 8
        acc += int(b[i])
        i += 1
    return (acc, b[r:])


def decode_bool(b: bytes) -> (int, bytes):
    return (int(b[0]) != 0, b[1:])


def decode_bytes_fix_size(b: bytes, size: int) -> (bytes, bytes):
    return (b[:size], b[size:])


def decode_bytes(b: bytes) -> (bytes, bytes):
    (size, remaining) = decode_int(b, 32)
    return (remaining[:size], remaining[size:])


def decode_str(b: bytes) -> (str, bytes):
    (size, remaining) = decode_int(b, 32)
    return (remaining[:size].decode("utf-8"), remaining[size:])

# ---------- obi -----------


class BRIDGE(InterfaceScore):
    @interface
    def get_request_info(self, id: int, key1: str, key2: str) -> bytes:
        pass

    @interface
    def relay_and_verify(self, proof: bytes) -> (dict, dict):
        pass


class RandomNumber(IconScoreBase):

    def __init__(self, db: IconScoreDatabase) -> None:
        super().__init__(db)
        self._bridge_address = VarDB("bridge_address", db, value_type=Address)
        self._number = VarDB("number", db, value_type=int)

    def on_install(self) -> None:
        super().on_install()

    def on_update(self) -> None:
        super().on_update()
    
    def decode_params(self, b: bytes) -> (str, int):
        (size, _) = decode_int(b, 64)
        return size

    def decode_result(self, b: bytes) -> int:
        (number, next) = decode_str(b)
        return int(number)

    @external
    def set_bridge(self, bridge_address: Address) -> None:
        self._bridge_address.set(bridge_address)

    @external(readonly=True)
    def get_bridge_address(self) -> Address:
        return self._bridge_address.get()

    @external(readonly=True)
    def get_number(self) -> int:
        return self._number.get()
        
    @external
    def set_number(self, proof: bytes) -> None:
        '''
        The parameter `proof` is the `non-EVM proof` obtained after requesting data 
        in the bandchain explorer.(https://guanyu-devnet.cosmoscan.io/oracle-script/11) 
        '''
        # if self.msg.sender != self.owner:
        #     revert(
        #         f"{self.msg.sender} is not authorized to make set_number calls. owner is {self.owner}")

        bridge = self.create_interface_score(self._bridge_address.get(), BRIDGE)
        req_res = bridge.relay_and_verify(proof)
        oracle_script_id = req_res["req"]["oracle_script_id"]
        params = req_res["req"]["calldata"]
        result = req_res["res"]["result"]

        if oracle_script_id != 11:
            revert(
                f"error oracle script id should be 11 but got {oracle_script_id}")

        (size) = self.decode_params(params)
        number = self.decode_result(result)
        self._number.set(number)